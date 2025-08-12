import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* DNS Prefetch للموارد الخارجية */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
          <link rel="dns-prefetch" href="//embed.tawk.to" />
          
          {/* Preconnect للموارد الحرجة */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* تحميل الخطوط بشكل محسن - غير محجوب */}
          <link
            rel="preload"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            as="style"
            onLoad={(e) => {
              const target = e.target as HTMLLinkElement;
              target.onload = null;
              target.rel = 'stylesheet';
            }}
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            />
          </noscript>
          
          {/* تحميل Font Awesome بشكل محسن - غير محجوب */}
          <link
            rel="preload"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            as="style"
            onLoad={(e) => {
              const target = e.target as HTMLLinkElement;
              target.onload = null;
              target.rel = 'stylesheet';
            }}
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
          />
          <noscript>
            <link
              rel="stylesheet"
              href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
              integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
              crossOrigin="anonymous"
            />
          </noscript>
          
          {/* Performance and SEO Meta Tags */}
          <meta name="theme-color" content="#1e293b" />
          <meta name="msapplication-TileColor" content="#1e293b" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          {/* Critical CSS Inline */}
          <style dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS for LCP optimization */
              *,*::before,*::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
              *::before,*::after{--tw-content:''}
              html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-feature-settings:normal;font-variation-settings:normal}
              body{margin:0;line-height:inherit;background-color:#0f172a;color:#f8fafc;font-family:Inter,sans-serif}
              .hero-section{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
              .hero-content{text-align:center;z-index:10;max-width:1200px;padding:0 1rem}
              .hero-title{font-size:3.5rem;font-weight:800;color:#fff;margin-bottom:1.5rem;line-height:1.1}
              .hero-subtitle{font-size:1.25rem;color:#94a3b8;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto}
              .btn-primary{background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);color:#fff;padding:1rem 2rem;border-radius:0.75rem;font-weight:600;text-decoration:none;display:inline-block;transition:all 0.3s ease;border:none;cursor:pointer}
              .btn-primary:hover{transform:translateY(-2px);box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)}
              .text-glow{text-shadow:0 0 20px rgba(139,92,246,0.5)}
              @media (max-width:768px){.hero-title{font-size:2.5rem}.hero-subtitle{font-size:1.1rem}}
            `
          }} />

        </Head>
        <body>
          <Main />
          <NextScript />
          {/* تحميل Tawk.to بشكل مؤجل لتحسين الأداء */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // تأجيل تحميل Tawk.to حتى تفاعل المستخدم
                function loadTawkTo() {
                  if (window.Tawk_API) return;
                  var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
                  (function(){
                    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
                    s1.async = true;
                    s1.src = 'https://embed.tawk.to/6890c1d03b79c51924b38a59/1j1qna5v3';
                    s1.charset = 'UTF-8';
                    s1.setAttribute('crossorigin', '*');
                    s0.parentNode.insertBefore(s1, s0);
                  })();
                }
                
                // تحميل عند التفاعل الأول أو بعد 3 ثوان
                ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
                  document.addEventListener(event, function() {
                    loadTawkTo();
                  }, { once: true, passive: true });
                });
                
                // تحميل بعد 3 ثوان كحد أقصى
                setTimeout(loadTawkTo, 3000);
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;