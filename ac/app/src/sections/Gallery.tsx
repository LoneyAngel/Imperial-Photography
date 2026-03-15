import { useEffect, useState } from 'react';
import { Photo } from '@/types';

interface GalleryProps {
  photos: Photo[];
}

export default function Gallery({ photos }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (!selectedPhoto) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhoto]);

  return (
    <div className="container mx-auto px-4 py-8">

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">暂无作品</p>
        </div>
      ) : (
        <div className="image-grid">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="image-card shadow-lg w-full text-left"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.url} alt={photo.title || '未命名作品'} />
              <div className="image-info">
                <h3 className="font-semibold mb-1">{photo.title || '未命名作品'}</h3>
                <p className="text-sm text-muted-foreground">摄影师: {photo.photographerName}</p>
                {photo.description && (
                  <p className="text-sm text-muted-foreground mt-1">{photo.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-background rounded-lg shadow-xl w-full max-w-5xl h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full">
              <div className="flex-1 bg-black flex items-center justify-center p-2">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title || '未命名作品'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="w-[320px] sm:w-[360px] md:w-[420px] p-6 flex flex-col overflow-hidden">
                <div className="flex items-start gap-4">
                  <h2 className="text-xl font-semibold leading-snug flex-1">
                    {selectedPhoto.title || '未命名作品'}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    关闭
                  </button>
                </div>

                <div className="mt-4 space-y-3 overflow-hidden">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">作者名字</p>
                    <p className="text-sm break-words">{selectedPhoto.photographerName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">作品名字</p>
                    <p className="text-sm break-words">{selectedPhoto.title || '—'}</p>
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground">作品介绍</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-hidden">
                      {selectedPhoto.description || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
