import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { Photo } from '@/types';

import InfinitePhotoGrid from '@/components/infinitePhotoGrid';
import { PhotoModal } from '@/components/photo-modal';
import { useFunction } from '@/context/function';

export default function MemberPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const { fetchMemberProfile } = useFunction();
  const [data, setData] = useState({ name: '', bio: '' });
  const { fetchMemberPhotos } = useFunction();
  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      const profile = await fetchMemberProfile(id);
      if (profile) {
        setData(profile);
      }
    };
    loadProfile();
  }, [id, fetchMemberProfile]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 作者信息 */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500">
          <img
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${id || 'user'}`}
            alt={data?.name}
            className="transition-transform duration-300 hover:[transform:rotate(360deg)]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <p className="text-xl font-semibold">{data?.name ?? '加载中...'}</p>
          {data?.bio && <p className="text-sm text-muted-foreground mt-1 max-w-md">{data.bio}</p>}
          {/* <p className="text-xs text-muted-foreground mt-1">共 {data?.total ?? 0} 件作品</p> */}
        </div>
      </div>
      {/* 照片列表 */}
      <InfinitePhotoGrid
        searchQuery={id || ''}
        setSelectedPhoto={setSelectedPhoto}
        fetchFn={fetchMemberPhotos}
      />

      {/* 照片详情弹窗 */}
      {selectedPhoto && <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
    </div>
  );
}
