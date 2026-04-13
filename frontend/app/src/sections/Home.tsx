import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/user';
import img1 from '@/assets/picture/1.jpg';
import img2 from '@/assets/picture/2.jpg';

export default function Home() {
  const navigate = useNavigate();
  const {user} = useUser();
  const handleBrowse = () => {
    if(user) console.log("原地跳转");
    navigate(user ? '/gallery' : '/register');
  };
  return (
    <div className="flex-1 bg-gradient-to-b from-slate-50 to-background">
      <div className="container flex flex-col items-center py-16">
        <div className="w-full max-w-4xl mx-auto text-center px-4 mt-6">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Imperial
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            一个面向摄影创作者的国际摄影组织
          </p>
          <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
            换一个角度，记录这些故事
          </p>
          <div className="mt-8 flex items-center gap-3 justify-center">
            <button
              onClick={handleBrowse}
              className="
                bg-transparent
                text-black
                px-4
                py-2
                border-b-2
                border-dashed
                border-gray-300
                font-medium
                transition-all
                duration-300
                hover:bg-gray-50
                hover:border-gray-700
                hover:text-gray-700
                active:scale-95 
              "
            >
              join us
            </button>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 items-center w-[50%]">
          <div className="w-full flex gap-8">
            <div className="flex flex-col gap-2">
              <div className="mt-2 text-sm text-muted-foreground text-start px-2">
                <h2 className="font-bold">白色的几何与蔚蓝的留白</h2>
              </div>
              <img src={img1} alt="home-1" className="object-cover h-[400px]" />
            </div>
            <div className="flex flex-col gap-4 justify-center w-[40%]">
              <p className="mt-2 text-sm text-muted-foreground">
                <span>JimboChan</span>
              </p>
              
              <p className="mt-2 text-sm text-muted-foreground">
                <span>有些浪漫是藏在风心里的。坐在杜乐丽花园的摩天轮上，当座舱缓缓升起到最高处，大半个巴黎的屋顶都在脚下。风里带着云朵的味道，秋千旋转出的光影，就像一场永不落幕的流动的盛宴。</span>
              </p>
            </div>
          </div>
          <div className="w-full flex gap-8">

            <div className="flex flex-col gap-4 justify-center w-[40%]">
              <p className="mt-2 text-sm text-muted-foreground">
                <span>CrazyJN</span>
              </p>
              
              <p className="mt-2 text-sm text-muted-foreground">
                <span>走入圣母院的那一刻，喧嚣的巴黎街头仿佛被厚重的石墙瞬间隔绝。
这张照片是我在光影交错的午后偶然捕捉到的。那种美不是夺目，而是一种深沉的静谧。抬头仰望，哥特式的肋架拱顶在上方交汇，像是一双双向上天祈祷的手，把人的视线和心境不由自主地往高处引。</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="mt-2 text-sm text-muted-foreground text-end px-2">
                <h2 className="font-bold">巴黎</h2>
              </div>
              <img src={img2} alt="home-2" className="object-cover h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
