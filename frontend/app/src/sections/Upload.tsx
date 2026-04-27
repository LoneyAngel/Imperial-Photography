import { useState } from 'react';
import { Upload as UploadIcon, ArrowLeft, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from '@/context/user';
import { useFunction } from '@/context/function';
import toast from 'react-hot-toast';
import { queryClient } from '@/App';
import { compressImage, isFileOversized, formatFileSize } from '@/utils/imageCompress';
import { useNavigate } from 'react-router-dom';
import {IMAGE_MAX_SIZE_MB} from "@/config/file"
import ErrorBoundary from '@/components/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

export default function Upload() {
  const { user } = useUser();
  const { uploadPhoto } = useFunction();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<{ url: string; title: string; description: string; authorName: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 检查是否需要压缩
    if (isFileOversized(selectedFile, IMAGE_MAX_SIZE_MB)) {
      console.log(`图片大于 ${IMAGE_MAX_SIZE_MB}MB，正在压缩...`);
      try {
        const result = await compressImage(selectedFile, { maxSizeMB: IMAGE_MAX_SIZE_MB });
        setFile(result.file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(result.file);

        console.log(`压缩完成：${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`);
      } catch {
        console.error('压缩失败，请选择更小的图片');
        setFile(null);
        setPreview(null);
      }
    } else {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const success = await uploadPhoto(title.trim(), description.trim(), file);
      if (success) {
        toast.success('上传成功');
        setUploadedPhoto({
          url: preview || '',
          title: title.trim() || '未命名作品',
          description: description.trim() || '',
          authorName: user?.name || '匿名用户'
        });
        // 刷新照片列表缓存
        queryClient.invalidateQueries({ queryKey: ['photos'] });
        queryClient.invalidateQueries({ queryKey: ['photos', 'owner'] });
      } else {
        toast.error('上传失败，请重试');
      }
    } catch {
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const resetToUploadForm = () => {
    setUploadedPhoto(null);
    setTitle('');
    setDescription('');
    setFile(null);
    setPreview(null);
  };

  // 条件返回在所有 hooks 之后
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-50px-64px)] flex items-center justify-center px-4 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">需要登录</h1>
          <p className="text-muted-foreground">请先登录后才能上传作品</p>
          <Button onClick={() => navigate('/member-auth')}>
            去登录
          </Button>
        </div>
      </div>
    );
  }
  return (
<div className="min-h-screen bg-slate-50/30 py-12 px-4">
      <ErrorBoundary>
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!uploadedPhoto ? (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-none shadow-2xl shadow-slate-200/50">
                  <div className="h-1.5 bg-primary w-full" />
                  <CardHeader className="space-y-1 pb-8 text-center">
                    <CardTitle className="text-xl tracking-tight">发布作品，让更多人看到你的创意</CardTitle>
                    <p className='text-gray-400 text-sm font-light'>在个人资料页面可以修改你的作者名字哦</p>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-xs font-bold uppercase text-slate-500">作品标题</Label>
                          <Input 
                            id="title" 
                            placeholder="给作品起个好听的名字..." 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-xs font-bold uppercase text-slate-500">作品描述 (可选)</Label>
                          <Textarea 
                            id="description" 
                            placeholder="分享作品背后的故事..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-500">上传图片 *</Label>
                          <div 
                            className={`
                              relative border-2 border-dashed rounded-xl transition-all duration-200
                              ${preview ? 'p-2' : 'p-10'}
                              ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}
                            `}
                            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                            onDragLeave={() => setIsDragActive(false)}
                            onDrop={() => setIsDragActive(false)}
                          >
                            {!preview ? (
                              <label htmlFor="file" className="cursor-pointer flex flex-col items-center group">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                  <UploadIcon className="h-6 w-6 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-slate-600">点击或拖拽图片到此处</span>
                                <span className="text-xs text-slate-400 mt-1">支持高质量 JPG, PNG, GIF</span>
                                <input id="file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
                              </label>
                            ) : (
                              <div className="relative rounded-lg overflow-hidden group">
                                <img src={preview} alt="预览" className="w-full max-h-[400px] object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button 
                                    type="button" 
                                    // variant="destructive" 
                                    size="sm" 
                                    onClick={() => setPreview(null)}
                                    className="gap-2"
                                  >
                                    <X className="h-4 w-4" /> 移除并重选
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" disabled={isUploading || !preview}>
                        {isUploading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在同步至云端...</>
                        ) : '立即发布作品'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-2xl overflow-hidden bg-white">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    <img 
                      src={uploadedPhoto.url} 
                      className="w-full h-full object-contain" 
                      alt="Uploaded" 
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-bold text-slate-700">发布成功</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{uploadedPhoto.title}</h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-md mx-auto">
                      {uploadedPhoto.description || "你的作品成功发布，审核通过后可以查看。"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => navigate('/gallery')} className="px-8 h-11">
                        去画廊查看
                      </Button>
                      <Button variant="outline" onClick={resetToUploadForm} className="px-8 h-11 gap-2">
                        <ArrowLeft className="h-4 w-4" /> 再传一张
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    </div>
  );
}