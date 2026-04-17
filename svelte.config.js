import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x',
			split: false
		}),
		prerender: {
			// Handle prerender errors gracefully
			handleHttpError: 'warn',
			// Only prerender specific routes that need to be static
			entries: []
		},
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;


// import adapter from '@sveltejs/adapter-vercel';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	compilerOptions: {
// 		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
// 		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
// 	},
// 	kit: {
// 		adapter: adapter(),
// 		typescript: {
// 			config: (config) => ({
// 				...config,
// 				include: [...config.include, '../drizzle.config.ts']
// 			})
// 		}
// 	}
// };

// export default config;
