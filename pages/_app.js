import "tailwindcss/tailwind.css";
import "../styles/main.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Murecho&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
