import chokidar from 'chokidar';
import { EventEmitter } from 'events';

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPath: string;
  private isWatching: boolean = false;
  
  constructor(watchPath: string) {
    super();
    this.watchPath = watchPath;
  }
  
  /**
   * Start watching the directory for new VTT files
   */
  start(): void {
    if (this.isWatching) {
      return;
    }
    
    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Don't ignore initial files
      awaitWriteFinish: {
        stabilityThreshold: 1000, // Wait 1 second after file stops changing
        pollInterval: 100,
      },
    });
    
    this.watcher
      .on('add', (filePath) => {
        if (filePath.endsWith('.vtt')) {
          this.emit('fileAdded', filePath);
        }
      })
      .on('change', (filePath) => {
        if (filePath.endsWith('.vtt')) {
          this.emit('fileChanged', filePath);
        }
      })
      .on('unlink', (filePath) => {
        if (filePath.endsWith('.vtt')) {
          this.emit('fileDeleted', filePath);
        }
      })
      .on('error', (error) => {
        console.error('File watcher error:', error);
        this.emit('error', error);
      })
      .on('ready', () => {
        console.error(`File watcher ready, monitoring: ${this.watchPath}`);
        this.isWatching = true;
        this.emit('ready');
      });
  }
  
  /**
   * Stop watching
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.watcher) {
        this.watcher.close().then(() => {
          this.watcher = null;
          this.isWatching = false;
          resolve();
        });
      } else {
        this.isWatching = false;
        resolve();
      }
    });
  }
  
  /**
   * Check if watcher is active
   */
  getIsWatching(): boolean {
    return this.isWatching;
  }
}
