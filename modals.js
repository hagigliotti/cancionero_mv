function abrirMetronomo() {
  const modal = document.getElementById("metroModal");
  if (modal) modal.style.display = "block";
}

function cerrarMetronomo() {
  const modal = document.getElementById("metroModal");
  if (modal) modal.style.display = "none";
}

// para cerrar con la X
window.cerrarMetronomo = cerrarMetronomo;
window.abrirMetronomo = abrirMetronomo;
