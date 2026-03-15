import { Photo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdminProps {
  photos: Photo[];
  onApprove: (photoId: string) => void;
  onReject: (photoId: string) => void;
}

export default function Admin({ photos, onApprove, onReject }: AdminProps) {
  const pendingPhotos = photos.filter(p => p.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">图片审核</h1>
        <p className="text-muted-foreground">待审核作品: {pendingPhotos.length}</p>
      </div>

      {pendingPhotos.length === 0 ? (
        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">没有待审核的作品</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingPhotos.map((photo) => (
            <Card key={photo.id}>
              <CardContent className="pt-6">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2">{photo.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  摄影师: {photo.photographerName}
                </p>
                {photo.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {photo.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onApprove(photo.id)}
                    className="flex-1"
                  >
                    通过
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onReject(photo.id)}
                    className="flex-1"
                  >
                    拒绝
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
