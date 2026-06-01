<template>
  <div class="not-found">
    <div class="not-found__content">
      <div class="not-found__icon">⛅</div>
      <h1 class="not-found__code">404</h1>
      <h2 class="not-found__title">Page Not Found</h2>
      <p class="not-found__message">Looks like this page got lost in the clouds.</p>
      <router-link to="/" class="not-found__btn">Back to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
}
.not-found__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.not-found__icon {
  font-size: 5rem;
}
.not-found__code {
  font-size: 6rem;
  font-weight: 800;
  margin: 0;
  color: var(--primary-color, #3d8bcd);
}
.not-found__title {
  font-size: 1.5rem;
  margin: 0;
}
.not-found__message {
  color: #888;
  margin: 0;
}
.not-found__btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: var(--primary-color, #3d8bcd);
  color: white;
  border-radius: 2rem;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}
.not-found__btn:hover {
  opacity: 0.85;
}
</style>
