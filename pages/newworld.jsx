import Head from "next/head";

export default function NewWorld() {
  return (
    <>
      <Head>
        <title>Gearscore - New World</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div
        dangerouslySetInnerHTML={{
          __html: `<!DOCTYPE html><html><head><title>Gearscore - New World</title></head><body><h1>New World Offers Page</h1></body></html>`
        }}
      />
    </>
  );
}
