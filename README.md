# ePub Reader with Text-to-Speech Support

This is a Next.js ePub reader application that allows you to read ePub books and listen to them using Microsoft Edge's built-in read-aloud functionality.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

### Adding or Updating an ePub File

To add or update an ePub file:

1. Remove the existing `trimmed_book.epub` file from the `/public` directory
2. Add your new ePub file with the same name `trimmed_book.epub` to the `/public` directory
3. Restart the application

### Loading Multiple Chapters

This reader has a "from-to" feature that allows you to load multiple chapters at once:

1. Use the "From" dropdown to select the starting chapter
2. Use the "To" dropdown to select the ending chapter
3. Click the "Load" button to load all selected chapters

### Using Microsoft Edge's Read-Aloud Feature

To have Microsoft Edge read the chapters for you:

1. First, load the chapters using the "from-to" feature as described above
2. Close the tab
3. Reopen the application in Microsoft Edge
4. Click the little reading icon near the URL bar (or press Ctrl+Shift+U)
5. Click the "A" button at the top of the reading view
6. Edge will start reading the loaded chapters to you

You don't need to load new chapters each time - this feature loads multiple chapters at once for continuous listening.

### When You Finish Chapters

When you've finished listening to chapters and want to load new ones:

1. Update the "From" and "To" selections
2. Click "Load"
3. Close the tab
4. Reopen the tab in Edge
5. Click the Edge reading icon
6. Click the "A" button
7. Edge will read the newly loaded chapters to you

## Features

- Light/dark mode toggle
- Responsive design for mobile and desktop
- Chapter selection and loading
- Compatible with Microsoft Edge's read-aloud functionality
- Persistent storage of reading progress

## Deploying to Vercel

This application can be deployed to Vercel. If you encounter build errors, make sure to:

1. Include the `vercel.json` file in your repository with the following configuration:
   ```json
   {
     "buildCommand": "next build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```

2. Ensure your ePub file (`trimmed_book.epub`) is included in the `/public` directory before deploying.

3. If you get an error about "No Output Directory named 'dist' found", this is because Vercel is looking for the wrong output directory. The configuration above fixes this by specifying `.next` as the output directory.

4. Note that Edge runtime may disable static generation. This is expected behavior when using the edge runtime as specified in the deployment logs.

## Contributing

If you need more features or find any issues, please open an issue or contribute to the project.

Made with ❤️ by C0dxg

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Shadow-Slave-Reading-edge-from-to-option
