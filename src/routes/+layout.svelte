<script>
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<nav>
    <a href="/">Inefficient</a>
    <a href="/inefficient">Efficent</a>
</nav>

{@render children()}

<style>
    nav {
        display: flex;
        justify-content: flex-start;
        gap: 40px;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        padding: 0 40px;
        background-color: #71717a;
        height: 60px;
        /* Ensure the nav stays on top of any floating words */
        position: relative;
        z-index: 100;
    }

    nav a {
        color: white;
        text-decoration: none;
        font-weight: bold;
    }
</style>