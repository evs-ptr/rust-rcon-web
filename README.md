# Rust RCon Web

A fast, reliable, and feature-rich web-based remote console (RCon) for Rust servers. Built with modern technologies to provide a seamless experience for server administrators.

![Rust RCon Web Screenshot](static/rcon-1.webp)

## Features

- **Live Console:** Real-time log streaming with color-coded message types.
- **Command History:** Easily navigate and re-execute previous commands.
- **Multi-Server Management:** Save and switch between multiple Rust servers effortlessly.
- **Resilient Reconnect:** Automatic reconnection with exponential back-off ensures you stay connected.
- **Secure by Default:** Supports secure WebSocket (`wss://`) connections and never stores credentials in plain text.
- **Open-Source:** MIT licensed and built with a modern, open-source stack.

## Technologies Used

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn-svelte](https://www.shadcn-svelte.com/) (a collection of reusable Svelte components)
- **Icons:** [Lucide Svelte](https://lucide.dev/guide/packages/lucide-svelte)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Testing:** [Vitest](https://vitest.dev/) for unit tests.
- **Runtime:** [Bun](https://bun.sh/)

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/evs-ptr/rust-rcon-web
   cd rust-rcon-web
   ```

2. **Install dependencies:**

   ```sh
   bun install
   ```

3. **Run the development server:**

   ```sh
   bun run dev
   ```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production version of the app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

## Testing

This project uses [Vitest](https://vitest.dev/) for unit testing.

- **Run all tests:**

  ```sh
  bun run test
  ```

- **Run tests in watch mode:**

  ```sh
  bun run test:unit
  ```

Test files are located in the `src/tests` directory.

## Project Structure

```
.
├── src
│   ├── lib
│   │   ├── components/ui  # Reusable UI components from shadcn-svelte
│   │   └── utils.ts       # Utility functions
│   ├── routes
│   │   ├── +page.svelte   # Landing page
│   │   └── rcon           # RCon interface, logic, and components
│   └── tests              # Unit tests
├── static                 # Static assets (e.g., favicon)
└── package.json           # Project dependencies and scripts
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

## License

Distributed under the MIT License.
