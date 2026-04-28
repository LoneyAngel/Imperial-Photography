import { useState } from 'react';
import { Download, Award, Calendar, CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ErrorBoundary from '@/components/ErrorBoundary';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import { useUser } from '@/context/user';

const mockLatestPhoto = {
  id: 'PH770231',
  title: '霓虹之夜：寂静的港湾',
  publishDate: '2023年10月27日',
};

export default function AchievementPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useUser();

  // 头像 seed 逻辑
  const avatarSeed = user?.id || user?.email?.split('@')[0] || 'user';
  // DiceBear API 地址
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;

  // 保存证书为图片的函数
  const handleDownload = () => {
    const node = document.getElementById('honor-certificate');
    if (!node) return;

    setIsDownloading(true);
    toPng(node, { quality: 1, backgroundColor: '#fff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `art-gallery-certificate-${mockLatestPhoto.id}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('证书保存失败:', err);
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <ErrorBoundary>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* 用户概览区域 - 现代、极简 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            {/* 这里的头像不旋转，保持其“正式印章”的稳重感 */}
            <div className="relative w-24 h-24 p-1 bg-white rounded-full ring-4 ring-slate-100 shadow-inner">
              <img
                src={avatarUrl}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full ring-2 ring-white">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user?.name}</h1>
              <p className="text-sm text-slate-500">
                社区成员 / 唯一 ID:{' '}
                <span className="font-mono text-xs">{user?.id.substring(0, 8)}...</span>
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                  Lv.1 新秀艺术家
                </div>
                <div className="text-slate-400 text-xs">加入时间: 2023.10.01</div>
              </div>
            </div>
          </motion.div>

          {/*  荣誉证书区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">最新收录证书</h2>
              <Button
                onClick={handleDownload}
                className="gap-2 shadow-lg active:scale-95 transition-all"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> 正在生成图片...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> 保存荣誉证书
                  </>
                )}
              </Button>
            </div>

            {/* 证书卡片 - 这里包含 DiceBear 头像印章 */}
            <Card
              id="honor-certificate"
              className="border-none shadow-2xl rounded-none overflow-hidden bg-white"
            >
              <div className="h-4 bg-slate-900 w-full" /> {/* 顶部装饰条 */}
              <CardContent className="relative p-12 sm:p-16 text-center space-y-10">
                {/* 装饰性外边框 */}
                <div className="absolute inset-4 border border-slate-100 pointer-events-none" />

                {/* 1. 顶部标题 */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                    数字艺术认证
                  </h3>
                  <h1 className="text-4xl font-serif tracking-widest uppercase text-slate-800">
                    作品收录荣誉证书
                  </h1>
                </div>

                <div className="w-20 h-px bg-slate-200 mx-auto" />

                {/* 2. 证书核心内容 */}
                <div className="space-y-5 max-w-lg mx-auto">
                  <p className="text-slate-600 leading-relaxed">
                    鉴于艺术家{' '}
                    <span className="font-bold text-slate-900 decoration-slate-300 underline underline-offset-4">
                      {user?.name}
                    </span>{' '}
                    的出色创意，
                  </p>
                  <p className="text-slate-600 leading-relaxed">其精心创作的作品</p>
                  <h2 className="text-3xl font-light italic text-slate-800 tracking-tight">
                    《{mockLatestPhoto.title}》
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    已成功通过社区评审，并正式录入
                    <span className="font-semibold text-slate-800">社区数字艺术画廊</span>
                    进行永久展示。该作品展示了极高的艺术水准与独特视角，特颁此证，以兹鼓励。
                  </p>
                </div>

                {/* 3. 底部信息栏与 DiceBear 数字印章 */}
                <div className="grid grid-cols-3 items-end w-full pt-16 gap-8 text-left border-t border-slate-100">
                  {/* 发布日期 */}
                  <div className="space-y-2 flex flex-col items-center">
                    <Calendar className="h-5 w-5 text-slate-300" />
                    <span className="text-xs font-medium text-slate-600">
                      {mockLatestPhoto.publishDate}
                    </span>
                    <div className="w-20 h-px bg-slate-200" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Date of Issue
                    </span>
                  </div>

                  {/* !!! 关键：DiceBear 头像作为数字印章 !!! */}
                  <div className="relative flex flex-col items-center group">
                    <div className="p-1 bg-white rounded-full ring-8 ring-green-50 shadow-inner overflow-hidden mb-1 w-20 h-20">
                      <img
                        src={avatarUrl}
                        alt="Seal"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {/* 印章上的文字圈 (可选，增加高级感) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 border border-green-200/50 rounded-full animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity">
                        <QrCode className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-green-300" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                      Verfied Artist Seal
                    </span>
                  </div>

                  {/* 作品编号 */}
                  <div className="space-y-2 flex flex-col items-center">
                    <Award className="h-5 w-5 text-slate-300" />
                    <span className="font-mono text-xs text-slate-600">{mockLatestPhoto.id}</span>
                    <div className="w-20 h-px bg-slate-200" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Certificate ID
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. 其他成就占位 (可选) */}
          <div className="border-t border-slate-100 pt-10 mt-10">
            <h3 className="text-base font-semibold text-slate-800 mb-5">艺术生涯徽章</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {[1, 2, 3, 4].map((b) => (
                <div
                  key={b}
                  className="aspect-square bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-3 text-center"
                >
                  <Award className="w-8 h-8 text-slate-300 mb-2" />
                  <div className="w-12 h-2 bg-slate-100 rounded" />
                </div>
              ))}
              <div className="aspect-square bg-slate-100 rounded-xl border border-slate-200/50 flex items-center justify-center">
                <span className="text-3xl text-slate-300">+</span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
