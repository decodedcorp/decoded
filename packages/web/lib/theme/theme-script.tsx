/**
 * Server Component — renders FOUC-prevention script in <head>.
 * No "use client" directive so it renders on the server without
 * triggering React 19's client-side <script> warning.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("theme")||"dark";if(t==="system"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t}catch(e){}})()`;
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
