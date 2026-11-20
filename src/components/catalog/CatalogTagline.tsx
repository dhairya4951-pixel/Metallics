export default function CatalogTagline({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8 md:py-12">
      <p className="font-serif text-base md:text-lg italic text-burgundy text-center max-w-md leading-relaxed">
        {text}
      </p>
    </div>
  );
}
