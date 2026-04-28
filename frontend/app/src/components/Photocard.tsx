import Masonry from 'react-masonry-css';
import '@/styles/PhotoGrid.css'; // 引入样式文件
import { Photo } from '@/types';

// 修复 React-Masonry-CSS 的默认导入问题
const MasonryComponent = (Masonry as any).default ? (Masonry as any).default : Masonry;

const breakpointColumnsObj = {
  default: 4, // 默认显示 4 列
  1100: 3, // 屏幕宽度 < 1100px 时显示 3 列
  700: 2, // 屏幕宽度 < 700px 时显示 2 列
  500: 1, // 屏幕宽度 < 500px 时显示 1 列
};

const PhotoGrid = ({
  photos,
  setSelectedPhoto,
}: {
  photos: Photo[];
  setSelectedPhoto: (photo: Photo) => void;
}) => {
  const items = photos.map((photo) => (
    <div key={photo.id} className="photo-item" onClick={() => setSelectedPhoto(photo)}>
      <img
        alt={photo.title}
        loading="lazy" // 开启懒加载
        src={photo.url}
      />
    </div>
  ));
  return (
    <MasonryComponent
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {items}
    </MasonryComponent>
  );
};

export default PhotoGrid;
