import { useState } from 'react';
import { Upload as UploadIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from '@/context/user';
import { useFunction } from '@/context/function';
import { useToast } from '@/context';
import { queryClient } from '@/App';
import { compressImage, isFileOversized, formatFileSize } from '@/utils/imageCompress';

const MAX_SIZE_MB = 3;

export default function Upload() {
  const { user } = useUser();
  const { uploadPhoto } = useFunction();
  const { showToast } = useToast();

  // 所有 useState 必须在条件返回之前定义（React Hooks 规则）
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<{ url: string; title: string; description: string; authorName: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 检查是否需要压缩
    if (isFileOversized(selectedFile, MAX_SIZE_MB)) {
      showToast(`图片大于 ${MAX_SIZE_MB}MB，正在压缩...`, 'info');

      try {
        const result = await compressImage(selectedFile, { maxSizeMB: MAX_SIZE_MB });

        setFile(result.file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(result.file);

        showToast(`压缩完成：${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`, 'success');
      } catch {
        showToast('压缩失败，请选择更小的图片', 'error');
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
        showToast('上传成功', 'success');
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
        showToast('上传失败，请重试', 'error');
      }
    } catch {
      showToast('上传失败，请重试', 'error');
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
          <Button onClick={() => window.location.href = '/member-auth'}>
            去登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {!uploadedPhoto ? (
          <Card>
            <CardHeader>
              <CardTitle>上传作品</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">作品名字</Label>
                  <Input
                    id="title"
                    placeholder="为您的作品起个名字"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">作品简介</Label>
                  <Textarea
                    id="description"
                    placeholder="写点关于作品的故事、拍摄地点或想表达的内容..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">图片文件 *</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="file" className="cursor-pointer block">
                      <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        点击选择或拖拽图片到此处
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        支持 JPG、PNG、GIF 等格式
                      </p>
                    </label>
                  </div>
                  {preview && (
                    <div className="mt-4">
                      <img src={preview} alt="预览" className="max-h-64 mx-auto rounded-lg shadow" />
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? '上传中...' : '上传图片'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>上传成功</CardTitle>
                <Button variant="outline" size="sm" onClick={resetToUploadForm}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  继续上传
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <img
                    src={uploadedPhoto.url}
                    alt={uploadedPhoto.title}
                    className="max-h-96 mx-auto rounded-lg shadow-lg object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{uploadedPhoto.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      作者: {uploadedPhoto.authorName}
                    </p>
                  </div>

                  {uploadedPhoto.description && (
                    <div>
                      <h4 className="font-medium mb-2">作品介绍</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {uploadedPhoto.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1" onClick={() => window.location.href = '/gallery'}>
                    查看所有作品
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={resetToUploadForm}>
                    上传新作品
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}