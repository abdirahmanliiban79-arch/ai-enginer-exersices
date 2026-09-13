"use client"

import Image from "next/image";
import { Copy, Download, ImageIcon, Loader2, Paintbrush, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { toast } from "sonner";


interface EditResult {
    url: string
    prompt: string
    timestamp: number
    imageCount?: number
    type: 'edit' | 'generate';
}


const ImageEditor = () => {
    const [activeTab, setActiveTab] = useState('edit')
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [imagePreview, setImagePreview] = useState<string[]>([])
    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(91)
    const [results, setResults] = useState<EditResult[]>([])

    const clearResults = () => {
        setResults([]);
    };

    // Animate the progress bar while a request is running.
    useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 90 ? 90 : prev + Math.floor(Math.random() * 10) + 5));
        }, 300);
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Copied to clipboard');
        } catch {
            toast.error('Failed to copy');
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;
        setSelectedImages(acceptedFiles);
        const prevPromises = acceptedFiles.map((file) => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        });
        Promise.all(prevPromises)
            .then((previews) => {
                setImagePreview(previews);
            })
            .catch((err) => {
                console.error("Error reading files:", err);
            });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        maxFiles: 5,
        onDrop,
        maxSize: 5 * 1024 * 1024,
    });

    const removeImage = (indexToRemove: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setImagePreview((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleProcessImage = async () => {
        if (activeTab === 'edit' && selectedImages.length === 0) {
            toast.error('Please select at least one image to edit');
            return;
        }

        if (activeTab === 'generate' && !prompt) {
            toast.error('Please enter a prompt to generate an image');
            return;
        }

        setIsLoading(true);
        setProgress(0);
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (activeTab === 'edit' && selectedImages.length > 0) {
                selectedImages.forEach((file) => {
                    formData.append('images', file);
                });
            }
            const endpoint = activeTab === 'edit' ? '/api/edit' : '/api/generate';
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.url) {
                throw new Error(data?.error || 'Failed to process image');
            }
            setResults((prev) => [...prev, data]);
            toast.success('Image processed successfully');
        } catch (err) {
            console.error(err);
            toast.error(err instanceof Error && err.message ? err.message : 'Failed to process image');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='max-w-6xl mx-auto space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <Upload className='h-4 w-4' />
                            {activeTab === 'edit' ? 'Upload & Edit' : 'Generate Image'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full grid grid-cols-2 mb-4">
                                <TabsTrigger value="edit">
                                    <Paintbrush className="mr-2 h-4 w-4" />
                                    Edit Image
                                </TabsTrigger>
                                <TabsTrigger value="generate">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Generate Image
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className='space-y-4 mt-4'>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:bg-muted/50'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    {imagePreview.length > 0 ? (
                                        <div className="space-y-4">
                                            <div
                                                className={`grid gap-3 ${imagePreview.length === 1
                                                    ? 'grid-cols-1'
                                                    : imagePreview.length === 2
                                                        ? 'grid-cols-2'
                                                        : 'grid-cols-2 md:grid-cols-4'
                                                    }`}
                                            >
                                                {imagePreview.map((preview, index) => (
                                                    <div key={index} className="relative group aspect-square">
                                                        <img
                                                            src={preview}
                                                            alt={`preview-${index}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                        <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium">
                                                            {index + 1}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => removeImage(index, e)}
                                                            className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground hover:bg-destructive rounded-full p-1 text-xs opacity-90 transition- h-5 w-5"
                                                            title="Remove image"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Click or drag more images to change selection (up to 5 images, max 5MB each)
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {isDragActive
                                                    ? 'Drop the images here...'
                                                    : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG, or JPEG (Max 5MB each, up to 5 files)
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* edit */}
                                <div className='bg-muted/50 p-4 rounded-lg space-y-4 mt-4'>
                                    <div className='flex items-center justify-center gap-2 mb-2'>
                                        <Paintbrush className='h-4 w-4' />
                                        <h2> Google Nano Banana</h2>
                                    </div>
                                    <p className='text-sm text-muted-foreground'>
                                        Google&apos;s latest image editing model in Gemini 2.5. Supports natural scene editing and style tranfser.
                                    </p>

                                </div>
                            </TabsContent>
                            <TabsContent value="generate" className='space-y-4 mt-4'>
                                {/* generation image Preview */}
                                <div className='border-b border-dashed rounded-lg text-center bg-gridient-to-br from-primary/5 to-secondary/5 '>
                                    <div className='space-y-4'>
                                        <Sparkles className="mx-auto h-12 w-12 text-primary" />
                                        <div className=''>
                                            <p className='text-lg font-medium'>AI Image Generation</p>
                                            <p className='text-muted-foreground text-sm'>Describe What you want to create and AI will generate it</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Google Gemini 3.5 flash model */}
                                <div className='bg-muted/50 p-4 rounded-lg space-y-4 mt-4'>
                                    <div className='flex items-center justify-center gap-2'>
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className='font-medium'>Google Gemini 3.5 flash</span>
                                    </div>
                                    <p className='text-sm text-muted-foreground'>Generate high-quality images in seconds. Supports up to 4 images at once.</p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* prompt input  */}
                        <div className="space-y-4 pt-4 border-t border-border mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="prompt" className="flex items-center gap-1.5 text-sm font-medium">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                    {activeTab === 'edit' ? 'Editing Instructions' : 'Prompt'}
                                </Label>
                                <Textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={
                                        activeTab === 'edit'
                                            ? "e.g., Change the background to a sunset beach, add sunglasses..."
                                            : "e.g., A futuristic cyberpunk city glowing in neon lights at night, 8k resolution..."
                                    }
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={handleProcessImage}
                                className="w-full"
                                disabled={
                                    isLoading ||
                                    !prompt.trim() ||
                                    (activeTab === 'edit' && selectedImages.length === 0)
                                }
                            >
                                {
                                    isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {activeTab === 'edit' ? (
                                                <>
                                                    <Paintbrush className="mr-2 h-4 w-4" />
                                                    Edit {selectedImages.length > 0 ? `${selectedImages.length} Image(s)` : 'Image'}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Image
                                                </>
                                            )}
                                        </>
                                    )
                                }
                            </Button>
                            {/* progress bar */}
                            {
                                isLoading && (
                                    <div className='space-y-2'>
                                        <Progress value={progress} className="w-full h-2" />
                                        <p className="text-center text-sm text-muted-foreground">
                                            {
                                                progress < 30 ? 'Uploading image...' :
                                                    progress < 60 ? 'Processing image...' :
                                                        progress < 90 ? 'Generating image...' :
                                                            'Almost done...'
                                            }
                                        </p>
                                    </div>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>

                {/* Result Image */}
                <Card className='flex flex-col max-h-screen'>
                    <CardHeader className='flex flex-row items-center justify-between flex-shrink-0'>
                        <CardTitle className='flex items-center gap-2'><ImageIcon className="h-5 w-5" /> Generated ({results.length})</CardTitle>
                        {
                            results.length > 0 && (
                                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={clearResults}>
                                    <Trash2 className="h-4 w-4" />
                                    Clear
                                </Button>
                            )
                        }
                    </CardHeader>
                    <CardContent className='flex overflow-hidden'>
                        {
                            results.length === 0 ? (
                                <div className='text-center p-12 text-muted-foreground w-full'>
                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No results yet</p>
                                    <p className="text-sm">Upload images and process them to see results here</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {results.map((result, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary">
                                                    {result.type === 'generate' ? (
                                                        <>
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            Generated
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Paintbrush className="w-3 h-3 mr-1" />
                                                            {result.imageCount} Image{result.imageCount && result.imageCount > 1 ? 's' : ''} Edited
                                                        </>
                                                    )}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(result.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            {/* image container with fixed aspect ratio and scroll */}
                                            <div className="relative w-full max-h-96 overflow-auto border rounded-lg bg-muted/20">
                                                <Image
                                                    src={result.url}
                                                    alt={`Result ${index + 1}`}
                                                    width={400}
                                                    height={400}
                                                    unoptimized
                                                    className="w-full h-auto object-contain"
                                                    style={{ minHeight: '200px' }}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Prompt:</p>
                                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                                    {result.prompt}
                                                </p>
                                            </div>

                                            {/* Action buttons - always visible */}
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownload(result.url, `edited-image-${index + 1}.png`)}
                                                    className="flex-1"
                                                >
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Download
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(result.url)}
                                                    className="flex-1"
                                                >
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    Copy URL
                                                </Button>
                                            </div>


                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ImageEditor;