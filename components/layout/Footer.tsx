export function Footer() {
  return (
    <footer className="border-t border-[--border] px-6 py-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[--foreground]/40">
        <p className="font-mono text-xs">Julian · Full-Stack / Creative Developer</p>
        <div className="flex items-center gap-6">
          <a href="mailto:rokert34@gmail.com" className="hover:text-[--foreground] transition-colors">
            Email
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[--foreground] transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
