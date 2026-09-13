import ImageEditor from '@/components/imageEditor'

export default function Home() {

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto p-4'>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          AI Image Editor
        </h1>
        <p className="text-md text-muted-foreground">
          Upload an image and let AI work its magic
        </p>
      </div>

      {/* image editor  */}

      <ImageEditor />

      </div>
    </div>
  )
}
