<script>
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<nav>
    <a href="/">Home</a>
    <a href="/efficient">Efficient Site</a>
    <a href="/inefficient">Inefficient Site</a>
</nav>

{@render children()}

<style>
    nav {
        display: flex;
        justify-content: flex-start;
        gap: 24px;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        padding: 0 40px;
        background-color: #111827;
        height: 60px;
        /* Ensure the nav stays on top of any floating words */
        position: relative;
        z-index: 100;
    }

    nav a {
        color: #e5e7eb;
        text-decoration: none;
        font-weight: bold;
    }

    nav a:hover {
        color: white;
    }
</style>