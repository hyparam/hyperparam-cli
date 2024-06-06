function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')
  app.innerHTML = `
    <h1>Hello, World!</h1>
    <p>Current time: ${new Date()}</p>
  `
}
render()
