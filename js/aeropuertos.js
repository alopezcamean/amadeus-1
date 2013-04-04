// ----------------------------------------------------------------------
/**
 * Se le pasan dos puntos del tipo LatLng(lat,lon)
 */
// ----------------------------------------------------------------------
function distancia2(punto1, punto2)
{
    lon1= punto1.lng().toString();
    lat1= punto1.lat().toString();
    lon2= punto2.lng().toString();
    lat2= punto2.lat().toString();
     
    rad = function(x) {
        return x*Math.PI/180;
    }

    var R     = 6378.137;                          //Radio de la tierra en km
    var dLat  = rad( lat2 - lat1 );
    var dLong = rad( lon2 - lon1 );

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d.toFixed(3);                      //Retorna tres decimales
}


/**
 * Se le pasan dos puntos del tipo LatLng(lat,lon)
 */
// ----------------------------------------------------------------------
function distancia(punto1,punto2)
{
    // Para usar el cálculo de distancia de google maps.
    // Ese necesario cargar la librería geometry
    // http://maps.googleapis.com/maps/api/js?key=&sensor=false&libraries=geometry">
    
    return (google.maps.geometry.spherical.computeDistanceBetween(punto1,punto2)/1000).toFixed(2);
}



// ----------------------------------------------------------------------
function toggleBounce(nombreMarcador)
{
    if (nombreMarcador.getAnimation() != null)
        nombreMarcador.setAnimation(null);
    else
    nombreMarcador.setAnimation(google.maps.Animation.BOUNCE);
    }


    //------------------------------------------------------------------------
    function crearMarcador(posicion,titulo,informacion,tipo)
    {
    // tipo: origen, destino, defecto
    // Ruta de iconos de google maps.
    // https://sites.google.com/site/gmapicons/home
    switch(tipo)
    {
    case 'origen':
    icono='http://www.google.com/mapfiles/dd-start.png';
    break;
    case 'destino':
    icono='http://www.google.com/mapfiles/dd-end.png';
    break;
    default:
    icono='http://www.google.com/mapfiles/marker.png';
    }
    
    var marcador = new google.maps.Marker(
    {
        map: mapa,
        draggable: false,
        //animation: google.maps.Animation.DROP,
        position: posicion,
        title: titulo,
        icon: icono,
        shadow: icono
        });   

    crearInfo(informacion,marcador);

    return marcador;
    }



    //------------------------------------------------------------------------
    function dibujarRuta(rutadepuntos)
    {
    return  new google.maps.Polyline(
    {
        map: mapa,
        path: rutadepuntos,
        geodesic: true,
        strokeColor: "FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2      
        });   
    }



    //------------------------------------------------------------------------
    function crearInfo(contenido,marcador)
    {
    var informacion= new google.maps.InfoWindow(
    {
        content: contenido
        });
    
    google.maps.event.addListener(marcador,'click',function(){
        informacion.open(mapa,marcador);
        });
   
    /*
   google.maps.event.addListener(marcador,'mouseout',function(){
        informacion.close();
    });
     */ 
    
    }



    //----------------------------------------------------------------------
    function puntoMedio(punto1,punto2)
    {
    lon1=parseFloat(punto1.lng().toString());
    lat1=parseFloat(punto1.lat().toString());
    lon2=parseFloat(punto2.lng().toString());
    lat2=parseFloat(punto2.lat().toString());
    
    latMedio=(lat1 + lat2)/2;
    lonMedio=(lon1 + lon2)/2;
    
    return new google.maps.LatLng(latMedio,lonMedio);
    }



    //----------------------------------------------------------------------
    function infoVuelo(origen,destino)
    {
    // origen y destino son marcadores -> objetos de tipo Marker.
    var velocidadAvion=850; // 850km/h de media de velocidad
    var maniobras=20; // 20 minutos para despegue y aterrizaje.
    
    // Calculamos el tiempo en minutos para recorrer los dos puntos.
    var tiempoMinutos= ( distancia(origen.getPosition(),destino.getPosition()) * 60 / velocidadAvion) + maniobras;
    
    horas = Math.floor(tiempoMinutos/60);
    minutos = Math.round(tiempoMinutos%60);
    
    mensaje= origen.getTitle()+" --> "+destino.getTitle()+": <b>"+distancia(origen.getPosition(),destino.getPosition())+"</b> km.<br/>Duración: <b>"+horas+"</b> horas y <b>"+minutos+"</b> minutos.";
    
    
    return mensaje;
    }



    //----------------------------------------------------------------------
    function cargarPuntos()
    {
    // Averiguamos las coordenadas del zoom actual del mapa.
    // Nos devuelve coordenadas superiorDerecha e inferiorIzquierda.
    limitesMapa=mapa.getBounds();
    
    latNE=limitesMapa.getNorthEast().lat().toString();
    lonNE=limitesMapa.getNorthEast().lng().toString();
    latSW=limitesMapa.getSouthWest().lat().toString();
    lonSW=limitesMapa.getSouthWest().lng().toString();
        
        
    $.post("peticiones.php?op=7",{
        latNE:latNE,
        lonNE:lonNE,
        latSW:latSW,
        lonSW:lonSW
        },function(resultado)

        {
        // Evaluamos el objeto JSON recibido.
        var aeropuertos=jQuery.parseJSON(resultado);
           
        // Recorremos el array recibido. Cada posición contiene un objeto con todas las propiedades que enviamos en la base de datos.
        // Recorremos ese array de aeropuertos.
        // En index tenemos el índice de cada posición del array y que es igual al id del aeropuerto, y en datos el objeto con los valores del aeropuerto.
        $.each(aeropuertos,function(index,datos){
                
            // Comprobamos si ya hemos cargado previamente ese punto en el mapa.
            // Si no está cargado lo creamos y lo anotamos en el array marcadores.
            if (!marcadores[index]) // Si ese marcador no existe lo añadimos
            {
            var posicion= new google.maps.LatLng(datos.latitud,datos.longitud);
            var titulo= datos.aeropuerto;
            var informacion ='<div style="font-size:smaller; width:380px;height:150px"><h4>Aeropuerto: '+datos.icao+'</h4>'+
            '<p><b>'+datos.aeropuerto+'</b>,<br/>Situado en la ciudad de <b>'+datos.ciudad+'</b> en <b>'+datos.pais+'.</b><br/>'+
            'Coord.: ('+datos.latitud+','+datos.longitud+') --- Elevacion: '+datos.elevacion+' m.'+
            '<br/>IATA: <b>'+datos.iata+'</b> --- ICAO: <b>'+datos.icao+'</b></div>';
               
            // Colocamos el marcador en el mapa.
            var marcador= crearMarcador(posicion,titulo,informacion,'');

            // Anotamos en el array marcadores (ponemos a true esa posición), el nuevo marcador colocado en el mapa.
            marcadores[index]=true;
            } 
            }); // $.each
        }); // $.post    
    }


    //------------------------------------------------------------------------
    function geolocalizar()
    {
    // Intenta primero localizacion usando W3C
    if (navigator.geolocation)
    {
    navigator.geolocation.getCurrentPosition(function(posicion)
    {
        posicionInicial=new google.maps.LatLng(posicion.coords.latitude,posicion.coords.longitude);
        mapa.setCenter(posicionInicial);
        crearMarcador(posicionInicial,'Estas aqui.','Tus coordenadas: ('+posicion.coords.latitude+","+posicion.coords.longitude+")",'');
             
        });
    }
    else // Tu navegador no soporta geolocalizacion.
    {
    alert("Fallo en Localización.");
    // Situamos al usuario en Madrid por ejemplo.
    mapa.setCenter(madrid);
}
}





////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function()
{
    $("#infomapa").fadeTo(0,0);
    
    // Array para controlar los marcadores que vamos situando en el mapa.
    marcadores=[];
    
    origen=null;
    destino=null;
    pOrigen=null;
    pDestino=null;
    linea=null;
    
    // Latitud NORTE(valores +) |ecuador| SUR(valores -)
    // Longitud OESTE(valores -) |Meridiano Greenwich| ESTE (valores +) 
    // Creamos dos puntos geográficos (latitud,longitud).
    var madrid = new google.maps.LatLng(40.4167754,-3.7037902);
    var instituto = new google.maps.LatLng(42.878676, -8.547272);
    var nyork = new google.maps.LatLng(40.7143528,-74.0059731);
    var miami = new google.maps.LatLng(25.7889689,-80.2264393);
    
    
    // Definimos las opciones de mapa en un objeto de tipo MapOptions
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var opcionesMapa ={
        center: instituto,
        zoom: 3,
        mapTypeId: google.maps.MapTypeId.ROADMAP    
    };
    
    // document.getElementById('objeto'); //returns a HTML DOM Object
    // var contents = $('#objeto');  //returns a jQuery Object
    // Calling $('#id') will return a jQuery object that wraps the DOM object and provides jQuery methods.
    // 
    // Si queremos obtener el objeto DOM lo haríamos con:
    // var contents = $('#objeto')[0];
    // 
    // En nuestro caso:
    // document.getElementById("mimapa");
    // o tambien: $("#mimapa")[0];
    mapa = new google.maps.Map($("#mimapa")[0],opcionesMapa);
    
    
    
    // Creamos dos marcas.
    //var mMadrid = crearMarcador(madrid,'Madrid','Capital de España','origen');
    //var mNyork = crearMarcador(nyork,'Nueva York','Bonita ciudad','destino');
    
    // Ejemplo de crearInfo:
    //crearInfo('Madrid capital de España',marcaMadrid);
    
    // Cambiamos el zoom del mapa.
    // mapa.setZoom(3);

    // Programamos que al hacer click en el marcador
    // del instituto haga una animación.
    // google.maps.event.addListener(marcaInstituto,'click',function(){
    //    toggleBounce(marcaInstituto);
    //    });
    
    // Dibujamos una linea entre Instituto y Madrid.
    //var linea = dibujarRuta([madrid,nyork]);
    
    // Centramos el mapa en el punto medio entre el instituto y Madrid.
    //mapa.setCenter(puntoMedio(madrid,nyork));
    
  
    // Programamos la acción de click sobre el botón #info.
    $("#info").click(function()
    {
        // Ponemos el contenido en infomapa.
        $("#infomapa").html(infoVuelo(origen,destino));
       
        $("#infomapa").stop().fadeTo(800,1,function()
        {
            $(this).delay(2000).fadeTo(600,0);
        });
    });
  
  
    // Al hacer click en el botón aeropuertos, cargamos los puntos de los aeropuertos.
    $("#aeropuertos").click(function()
    {
        cargarPuntos();
    }); // click aeropuertos.
  
  
    $("#origen,#destino").keyup(function()
    {
        // Averiguamos el nombre del objeto dónde estamos escribiendo.
        casillaclick=$(this).attr('id');
        
        $.post("peticiones.php?op=8",{
            aeropuerto:$(this).val()
        },function(datos){
            // Convierte a objeto de Javascript el JSON recibido desde PHP.
            aeropuertos = jQuery.parseJSON(datos);
            listado='';
        
            // Recorremos el array.
            $.each(aeropuertos,function(index,valor)
            {
                // En index tenemos del 0 al 10 como máximo.
                // En valor tendremos el objeto con todas sus prop.
                listado+="<li>"+valor.aeropuerto+", "+valor.ciudad+" - "+valor.pais+"("+valor.iata+")</li>";
            });
            
            if (aeropuertos.length !=0)
                $("#zonasugerencias").addClass("zonaconborde");
            else
                $("#zonasugerencias").removeClass("zonaconborde");
        
            // Metemos en el contenedor el listado generado con <li>...
            $("#zonasugerencias").html(listado);
            
            $("#zonasugerencias li").each(function()
            {
                $(this).mouseover(function()
                {
                    $(this).addClass("enlace_sugerencia_over");
                });
            
                $(this).mouseout(function()
                {
                    $(this).removeClass("enlace_sugerencia_over");
                });
            
                $(this).click(function()
                {
                    $("#"+casillaclick).val($(this).text());
                
                    // Necesitamos averiguar la posición dónde hemos hecho click, 
                    // para poder ir al array aeropuertos y coger los datos de latitud y longitud de ese aeropuerto.
                    // $(this).parent().children().index($(this));
                    posiciondeclick=$(this).parent().children().index($(this));
                  
                    if (casillaclick=='origen')
                    {
                        // Dibujamos el punto origen.
                        pOrigen=new google.maps.LatLng(aeropuertos[posiciondeclick].latitud,aeropuertos[posiciondeclick].longitud);
                    
                        // Comprobamos si hay un marcador previo creado.
                        if (origen!=null)
                            origen.setMap(null);  //Borra el marcador origen del mapa.
                        
                        origen=crearMarcador(pOrigen,aeropuertos[posiciondeclick].ciudad,aeropuertos[posiciondeclick].ciudad+" - "+aeropuertos[posiciondeclick].pais+" ("+aeropuertos[posiciondeclick].iata+")",'origen');
                
                        // Que coloque el centro del mapa en este punto
                        mapa.setCenter(pOrigen);
                    
                        // Que ponga zoom del mapa a 4.
                        mapa.setZoom(4);
                    }
                    else // hemos hecho click en la casilla de destino.
                    {
                        // Dibujamos el punto destino.
                        pDestino=new google.maps.LatLng(aeropuertos[posiciondeclick].latitud,aeropuertos[posiciondeclick].longitud);
                    
                        // Comprobamos si hay un marcador previo creado.
                        if (destino!=null)
                            destino.setMap(null);  //Borra el marcador destino del mapa.
                        
                        destino=crearMarcador(pDestino,aeropuertos[posiciondeclick].ciudad,aeropuertos[posiciondeclick].ciudad+" - "+aeropuertos[posiciondeclick].pais+" ("+aeropuertos[posiciondeclick].iata+")",'destino');
                
                        // Que coloque el centro del mapa en este punto
                        mapa.setCenter(pDestino);
                    
                        // Que ponga zoom del mapa a 4.
                        mapa.setZoom(4);
                    } 
                 
                    // Si tenemos origen y destino, dibujamos la ruta
                    // Y cubrimos la información del vuelo.
                    if (origen!=null && destino!=null)
                    { 
                        // Dibujamos la ruta de los dos puntos.
                        // Si hay una ruta dibujada previamente, la borramos.
                        if (linea!=null)                        
                            linea.setMap(null);
                        
                        linea=dibujarRuta([pOrigen,pDestino]);
                        mapa.setCenter(puntoMedio(pOrigen,pDestino));
                       
                        // Ajustamos el zoom para que entre la ruta en el mapa.
                        var misLimites = new google.maps.LatLngBounds();
                        misLimites.extend(pOrigen);
                        misLimites.extend(pDestino);
                        mapa.fitBounds(misLimites);
                    }
  
                    // Ocultamos el div de sugerencias
                    $("#zonasugerencias").removeClass("zonaconborde").html("");
                });
            });

        });
    });
  

    $("#geolocalizar").click(function()
    {
        geolocalizar();
    });

 
    // O también se puede hacer la llamada de la siguiente forma:
    // $("#geolocalizar").click(geolocalizar);
  
  
  
});  // document.ready.