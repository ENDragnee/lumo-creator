import { ContentRenderer } from '@/components/contentRender';

export default function ContentPage() {
  return (
    <div className="w-full">
      <header className="p-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Published Content</h1>
        <ContentRenderer />
      </header>
    </div>
  );
}