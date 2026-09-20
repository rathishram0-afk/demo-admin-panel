import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Module Error Boundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });

    const errStr = error?.toString?.() || '';
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      errStr.includes('Failed to fetch dynamically imported module') ||
      errStr.includes('Importing a module script failed') ||
      error?.message?.includes('import');

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk-error-reloaded') === 'true';
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-error-reloaded', 'true');
        window.location.reload(true);
      }
    }
  }

  handleReset = () => {
    sessionStorage.removeItem('chunk-error-reloaded');
    sessionStorage.removeItem('retry-lazy-refreshed');
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      const errStr = this.state.error?.toString?.() || '';
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        errStr.includes('Failed to fetch dynamically imported module') ||
        errStr.includes('Importing a module script failed');

      return (
        <div className="glass-panel p-8 rounded-3xl border border-red-500/40 text-center max-w-xl mx-auto my-12 space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-cyber text-lg font-black text-white uppercase tracking-wider">
              {this.props.moduleName || 'Module'} Encountered an Error
            </h3>
            <p className="text-xs text-red-300 font-sans leading-relaxed">
              {isChunkError
                ? 'A new version of G-FORCE was deployed. Click below to load the updated module.'
                : (this.state.error?.toString() || 'A runtime error occurred while rendering this module.')}
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-cyber font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reload Module
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
