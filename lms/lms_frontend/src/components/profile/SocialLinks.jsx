/**
 * SocialLinks Component
 * 
 * Displays social media links as icons.
 * 
 * Props:
 * - socialLinks: object { facebook, linkedin, github, website }
 * - size: string ('sm' | 'md' | 'lg', default: 'md')
 * - showLabels: boolean (show text labels, default: false)
 */
const SocialLinks = ({ socialLinks = {}, size = 'md', showLabels = false }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;

  const socialPlatforms = [
    {
      key: 'facebook',
      name: 'Facebook',
      icon: (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: 'text-blue-600',
      hoverColor: 'hover:text-blue-700',
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: 'text-blue-700',
      hoverColor: 'hover:text-blue-800',
    },
    {
      key: 'github',
      name: 'GitHub',
      icon: (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
      color: 'text-slate-900',
      hoverColor: 'hover:text-slate-700',
    },
    {
      key: 'website',
      name: 'Website',
      icon: (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      color: 'text-slate-600',
      hoverColor: 'hover:text-slate-800',
    },
  ];

  const hasAnyLink = socialPlatforms.some(
    (platform) => socialLinks[platform.key] && socialLinks[platform.key].trim() !== ''
  );

  if (!hasAnyLink) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {socialPlatforms.map((platform) => {
        const url = socialLinks[platform.key];
        if (!url || url.trim() === '') return null;

        // Ensure URL has protocol
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          fullUrl = `https://${url}`;
        }

        return (
          <a
            key={platform.key}
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 ${platform.color} ${platform.hoverColor} transition`}
            title={platform.name}
          >
            {platform.icon}
            {showLabels && (
              <span className="text-sm font-medium">{platform.name}</span>
            )}
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;

