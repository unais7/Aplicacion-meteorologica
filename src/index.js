import { flip } from "@popperjs/core";
import * as bootstrap from "bootstrap";
import L from "leaflet";

// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;
window.EliminarDiv = EliminarDiv;
window.EliminarCard = EliminarCard;
window.AnadirDropFiltro = AnadirDropFiltro;
window.ObtenerLocal = ObtenerLocal;
window.EliminarFiltro = EliminarFiltro;
window.iSesion = iSesion;
window.CerrarSesion = CerrarSesion;

var sCiudad = new Set();
var contaux = 0;
var Idaux = 0;

$(".drag-zone").css("visibility", "hidden");
$("#drag-zone-title").css("visibility", "hidden");
$(`#drag-zone0`).droppable();
$(`#drag-zone1`).droppable();
$(`#drag-zone2`).droppable();

Iniciado();

function Iniciado() {
  fetch("http://10.10.17.171:5000/api/Baliza", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }).then((response) => {
    if (response.ok) {
      $("#login").css("visibility", "hidden");
      CrearMapa();
    } else {
      $("#contenido").css("visibility", "hidden");
      $("body").css("background-color", "#0d6efd");
    }
  });
}

//funcion para iniciar sesion
function iSesion() {
  var user = $("#lUsuario").val();
  var contr = $("#lContra").val();
  $.ajax({
    url: "http://10.10.17.171:5000/Users/authenticate",
    type: "POST",
    data: JSON.stringify({ username: user, password: contr }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      $("body").css("background-color", "white");
      $("#login").css("visibility", "hidden");
      $("#contenido").css("visibility", "visible");
      localStorage.setItem("token", response.token);
      CrearMapa();
    },
    error: function () {
      alert("Usuario o Contraseña mal introducida");
    },
  });
}

function CrearMapa() {
  //Conexion Api con fetch para poner las valizas que tengamos en el json tanto como en la base de datos
  var HayCiudad = new Set();
  fetch("http://10.10.17.171:5000/api/Baliza", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((api) => {
      console.log("pasa");
      //Añade mapa y marcadores
      let mymap = L.map("map").setView([43.0621, -2.43755], 8);
      L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(mymap);
      const oBalizas = JSON.parse(window.Balizas);
      oBalizas.forEach((b) => {
        api.forEach((a) => {
          var lNombre = b.Nombre.toLowerCase();
          if (lNombre.includes(a.municipio) && !HayCiudad.has(a.municipio)) {
            var marcador = L.marker([b.GpxY, b.GpxX])
              .addTo(mymap)
              .on("click", function () {
                MostrarCiudad(a.municipio, b.Id);
              });
            HayCiudad.add(a.municipio);
          }
        });
      });
    });
}

//Enseña un pequeño div con el nombre de la ciudad y con un icon para eliminarlo
function MostrarCiudad(Localizacion, Id) {
  $("#mInicial").remove();
  if (contaux == 0) {
    $("#drag-zone-title").css("visibility", "visible");
  }
  if (contaux < 12) {
    if (!sCiudad.has(Localizacion)) {
      contaux++;
      $("#CityContainer").append(`
      <div class="CityDiv" id="${Id}" value="${Localizacion}" >
      <h3>${Localizacion} <button type="button" class="btn-close" aria-label="Close" id="Btn${Id}" onclick="EliminarDiv('${Id}', '${Localizacion}')"></button></h3>
      </div>
      `);

      //drag y drop de los elementos de la ciudad al check nox
      sCiudad.add(Localizacion);
      $(function () {
        $(`#${Id}`).draggable({
          revert: true,
          revertDuration: 0,
          start: function () {
            $(`.drag-zone`).css("visibility", "visible");
          },
          stop: function () {
            $(`.drag-zone`).css("visibility", "hidden");
          },
        });
        for (var i = 0; i < 4; i++) {
          DropCityTag(i);
        }
      });
    }
  } else {
    if (!document.getElementById("alerta")) {
      $(
        "<div id='alerta'>No se pueden introducir mas de 12 valores</div>"
      ).dialog({
        buttons: {
          Ok: function () {
            var boolaux = false;
            $(this).dialog("close").remove();
          },
        },
        draggable: false,
        title: "Alerta!",
      });
    }
  }
}

//drag de los elementos del filtro
$("#humedad").draggable({ helper: "clone" });
$("#viento").draggable({ helper: "clone" });
$("#lluvia").draggable({ helper: "clone" });

function AnadirDropFiltro(i) {
  //dropable del card
  $(`#drag-zone-lleno${i}`).droppable({
    drop: function (event, ui) {
      var clase = $(ui.draggable).attr("class");
      console.log(clase);
      if (clase.includes("bi")) {
        var tem = $(ui.draggable);
        var value = tem.attr("id");
        //console.log(value);
        var lBaliza = JSON.parse(localStorage.getItem(`CiudadInfo${i}`));
        if (value.includes("humedad")) {
          $("#cHumedad" + i).css("display", "block");
          lBaliza.humedad = true;
        }
        if (value.includes("viento")) {
          $("#cViento" + i).css("display", "block");
          lBaliza.viento = true;
        }
        if (value.includes("lluvia")) {
          $("#cLluvia" + i).css("display", "block");
          lBaliza.pretipitacion = true;
        }

        localStorage.setItem(`CiudadInfo${i}`, JSON.stringify(lBaliza));
      }
    },
  });
}

//Eliminar el div con el nombre de la ciudad
function EliminarDiv(Id, Localizacion) {
  var elem = document.getElementById(Id);
  elem.parentNode.removeChild(elem);
  contaux--;
  sCiudad.delete(Localizacion);
}

//Eliminar una card
function EliminarCard(Id) {
  $(`#card${Id}`).remove();

  $(`#drag-zone-lleno${Id}`)
    .removeClass()
    .addClass("drag-zone")
    .removeAttr("id")
    .attr("id", `drag-zone${Id}`)
    .append("<i class='bi bi-plus-square'></i>")
    .css("border", "4px dashed white")
    .css("visibility", "hidden");

  localStorage.removeItem(`CiudadInfo${Id}`);
  DropCityTag(Id);
}

//funcion cuando se dropea el tag de ciudad
function DropCityTag(Id) {
  $(`#drag-zone${Id}`).droppable({
    drop: function (event, ui) {
      var clase = $(ui.draggable).attr("class");
      if (clase.includes("CityDiv")) {
        var tem = $(ui.draggable);
        var value = tem.attr("value");
        var gCiudad = {
          Nombre: value,
          posicion: Id,
          humedad: false,
          viento: false,
          precipitacion: false,
        };
        localStorage.setItem(`CiudadInfo${Id}`, JSON.stringify(gCiudad));
        CreateCard(Id, value);
      }
    },
  });
}

//funcion que crea las card
function CreateCard(Id, value) {
  var gTiempo = "sin valor";
  var gTemperatura = "sin valor";
  var gHumedad = "sin valor";
  var gViento = "sin valor";
  var gLluvia = "sin valor";
  var gImg = "sin valor";

  //fech con el que obtenemos los valores que usaremos en las cards
  fetch(`http://10.10.17.171:5000/api/Baliza/${value}`)
    .then((response) => {
      return response.json();
    })
    .then((get) => {
      console.log(get);
      gTiempo = get.descripcion;
      gTemperatura = get.temperatura;
      gHumedad = get.humedad;
      gViento = get.velocidad_Viento;
      gLluvia = get.precipitacion_acumulada;
      gImg = get.imagen;

      //console.log(value);
      $("#drag-zone-title").css("visibility", "hidden");
      var card = `
              <div class="card border-dark mb-3" id="card${Id}" style="width: 20rem;">
                <div class="card-body">
                  <h3 class="card-title tTexto" style="text-aling: center;">${value}  <img class="tImg" src="https://opendata.euskadi.eus/${gImg}" alt="no hay imagen"><button type="button" class="btn-close btn-card" onclick="EliminarCard(${Id})" aria-label="Close"></button>
                  </h3>
                  <p><b>Tiempo:</b> ${gTiempo}</p>
                  <p><b>Temperatura:</b> ${gTemperatura} &deg;C</p>
                  <p id="cHumedad${Id}"><b>Humedad:</b> ${gHumedad} %<button type="button" class="btn-close btn-card" onclick="EliminarFiltro('cHumedad${Id}')" aria-label="Close"></button></p>
                  <p id="cViento${Id}"><b>Velocidad del Viento:</b> ${gViento} Km/H<button type="button" class="btn-close btn-card" onclick="EliminarFiltro('cViento${Id}')" aria-label="Close"></button></p>
                  <p id="cLluvia${Id}"><b>Precipitación Acumulada:</b> ${gLluvia} mm<button type="button" class="btn-close btn-card" onclick="EliminarFiltro('cLluvia${Id}')" aria-label="Close"></button></p>
                </div>
              </div>
              `;
      console.log(Id);
      $(`#drag-zone${Id}`)
        .empty()
        .append(card)
        .css("border", "none")
        .show()
        .removeClass()
        .addClass("drag-zone-lleno")
        .removeAttr("id")
        .attr("id", `drag-zone-lleno${Id}`)
        .droppable("destroy")
        .attr("value", `${Id}`)
        .css("visibility", "visible");

      var Vaux = $(`#drag-zone-lleno${Id}`).attr("value");
      AnadirDropFiltro(Vaux);
    });
}

function EliminarFiltro(Tag) {
  $(`#${Tag}`).css("display", "none");
}

//funcion que crea cartas de informacion usando la informacion de local storage
function ObtenerLocal() {
  var oLocal0 = JSON.parse(localStorage.getItem("CiudadInfo0"));
  var oLocal1 = JSON.parse(localStorage.getItem("CiudadInfo1"));
  var oLocal2 = JSON.parse(localStorage.getItem("CiudadInfo2"));

  if (oLocal0 !== null) {
    CreateCard(oLocal0.posicion, oLocal0.Nombre);
    ObtenerFiltroLocal(oLocal0, 0);
  }
  if (oLocal1 !== null) {
    CreateCard(oLocal1.posicion, oLocal1.Nombre);
    ObtenerFiltroLocal(oLocal1, 1);
  }
  if (oLocal2 !== null) {
    CreateCard(oLocal2.posicion, oLocal2.Nombre);
    ObtenerFiltroLocal(oLocal2, 2);
  }
}

function ObtenerFiltroLocal(obj, id) {
  if (obj.humedad == true) {
    $("#cHumedad" + id).css("display", "block");
  }
  if (obj.viento == true) {
    $("#cViento" + id).css("display", "block");
  }
  if (obj.pretipitacion == true) {
    $("#cLluvia" + id).css("display", "block");
  }
}

function CerrarSesion() {
  localStorage.removeItem("token");
  location.reload();
}
