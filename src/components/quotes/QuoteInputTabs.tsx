import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UploadCloud, FileText, X, Image as ImageIcon } from 'lucide-react'

interface QuoteInputTabsProps {
  rawText: string
  onRawTextChange: (value: string) => void
  imageFileName?: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearImage: () => void
}

function RawTextPane({
  rawText,
  onRawTextChange,
}: Pick<QuoteInputTabsProps, 'rawText' | 'onRawTextChange'>) {
  return (
    <TabsContent value="text" className="mt-3 flex flex-col gap-2">
      <div className="relative">
        <textarea
          rows={7}
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder="Paste a WhatsApp message, vendor email, or invoice breakdown here..."
          className="w-full p-4 rounded-2xl bg-white border border-royal-plum/15 focus:border-royal-plum focus:ring-1 focus:ring-royal-plum text-sm text-royal-plum placeholder:text-royal-plum/70 font-normal resize-y min-h-[160px]"
        />
        {rawText && (
          <button
            type="button"
            onClick={() => onRawTextChange('')}
            className="absolute top-3 right-3 text-2xs text-royal-plum/70 hover:text-royal-plum bg-soft-ivory px-2 py-0.5 rounded-full border border-royal-plum/10"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-2xs text-royal-plum/70 px-1 font-mono">
        <span>Minimum 10 characters</span>
        <span>{rawText.length} characters</span>
      </div>
    </TabsContent>
  )
}

function DropzonePane({
  imageFileName,
  onFileChange,
  onClearImage,
}: Pick<QuoteInputTabsProps, 'imageFileName' | 'onFileChange' | 'onClearImage'>) {
  return (
    <TabsContent value="dropzone" className="mt-3 flex flex-col gap-2">
      <label className="border-2 border-dashed border-royal-plum/15 hover:border-marigold rounded-2xl p-6 text-center bg-soft-ivory/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <UploadCloud className="w-8 h-8 text-royal-plum/70" />
        <span className="text-xs font-semibold text-royal-plum">
          Drop JPEG, PNG, or invoice screenshot here, or tap to browse
        </span>
        <span className="text-3xs text-royal-plum/70">
          Supports estimates, WhatsApp screenshots &amp; PDF snapshots up to 10MB
        </span>
      </label>

      {imageFileName && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-royal-plum/10 text-xs">
          <div className="flex items-center gap-2 truncate">
            <ImageIcon className="w-4 h-4 text-marigold shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{imageFileName}</span>
          </div>
          <button
            type="button"
            onClick={onClearImage}
            className="p-1 rounded-full hover:bg-royal-plum/5 text-royal-plum/70 hover:text-royal-plum"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </TabsContent>
  )
}

/** Dual input tabs: raw text paste and screenshot dropzone. */
export function QuoteInputTabs({
  rawText,
  onRawTextChange,
  imageFileName,
  onFileChange,
  onClearImage,
}: QuoteInputTabsProps) {
  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid grid-cols-2 bg-soft-ivory border border-royal-plum/10 rounded-full p-1 h-10">
        <TabsTrigger
          value="text"
          className="rounded-full text-xs font-semibold data-[state=active]:bg-marigold data-[state=active]:text-royal-plum"
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          <span>Raw Text Paste</span>
        </TabsTrigger>
        <TabsTrigger
          value="dropzone"
          className="rounded-full text-xs font-semibold data-[state=active]:bg-marigold data-[state=active]:text-royal-plum"
        >
          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
          <span>Screenshot / Dropzone</span>
        </TabsTrigger>
      </TabsList>

      <RawTextPane rawText={rawText} onRawTextChange={onRawTextChange} />
      <DropzonePane
        imageFileName={imageFileName}
        onFileChange={onFileChange}
        onClearImage={onClearImage}
      />
    </Tabs>
  )
}
