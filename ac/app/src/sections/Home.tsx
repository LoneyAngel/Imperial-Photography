import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const handleBrowse = () => {
    navigate(user ? '/' : '/register');
  };
  return (
    <div className="flex-1 bg-gradient-to-b from-slate-50 to-background">
      <div className="container flex flex-col items-center py-16">
        <div className="w-full max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Imperial use
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            一个面向摄影创作者的国际摄影组织
          </p>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            换一个角度，记录这些故事
          </p>
          <div className="mt-8 flex items-center gap-3 justify-center">
            <Button onClick={handleBrowse}>join us</Button>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 items-center w-[50%]">
          <div className="w-full flex gap-8">
            <div className="flex flex-col gap-2">
              <div className="mt-2 text-sm text-muted-foreground text-start px-2">
                <h2 className="font-bold">巴黎</h2>
              </div>
              <img src="dist/images/t1.png" alt="home-1" className="object-cover h-[400px]" />
            </div>
            <div className="flex flex-col gap-4 justify-center">
              <p className="mt-2 text-sm text-muted-foreground">
                <span>张三</span>
              </p>
              
              <p className="mt-2 text-sm text-muted-foreground">
                <span>这是我在巴黎的一次照片分享，展示了我的独特视角。</span>
              </p>
            </div>
          </div>
          <div className="w-full flex gap-8">

            <div className="flex flex-col gap-4 justify-center">
              <p className="mt-2 text-sm text-muted-foreground">
                <span>张三</span>
              </p>
              
              <p className="mt-2 text-sm text-muted-foreground">
                <span>这是我在巴黎的一次照片分享，展示了我的独特视角。</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="mt-2 text-sm text-muted-foreground text-end px-2">
                <h2 className="font-bold">巴黎</h2>
              </div>
              <img src="dist/images/t1.png" alt="home-1" className="object-cover h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
