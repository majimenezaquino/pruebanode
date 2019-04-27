' uso estricto ' ;

const  Compute  =  require ( ' @ google-cloud / compute ' );
const  http  =  require ( ' http ' );

const  compute  =  new  Compute ();

const  zone  =  computar . zona ( ' us-central1-a ' );

// Crear una nueva máquina virtual, utilizando la imagen ubuntu predeterminada. El script de inicio
// instala Node e inicia un servidor Node.
const  config  = {
  os :  ' ubuntu ' ,
  http :  true ,
  metadatos : {
    artículos : [
      {
        clave :  ' startup-script ' ,
        valor :  ` #! / bin / bash
        # Obtener el administrador de versiones de Node e instalar Node 8.
        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | golpetazo
        export NVM_DIR = "$ HOME / .nvm"
        [-s "$ NVM_DIR / nvm.sh"] && \. "$ NVM_DIR / nvm.sh" # Esto carga nvm
        nvm install 8
        # Instalar git
        apt-get --assume-yes instala git
        # Clonar la aplicación de muestra e iniciarla.
        git clone https://github.com/fhinkel/nodejs-hello-world.git
        cd nodejs-hello-world
        npm start & `
      }
    ]
  }
};

const  vm  =  zona . vm ( ' vm-with-node-server ' );

( async () => {
  prueba {
    const  data  =  esperar  vm . crear (config);
     operación  const = datos [ 1 ];
    la espera de  la operación . promesa ();

    // IP externa de la máquina virtual.
     metadatos  const =  esperar  vm . getMetadata ();
    const  ip  = metadata [ 0 ]. networkInterfaces [ 0 ]. accessConfigs [ 0 ]. natIP ;
    consola . log ( ` Arrancando una nueva VM con IP http: // $ { ip } ... ` );

    // Haga ping a la VM para determinar cuándo está listo el servidor HTTP.
    dejar en espera =  verdadero ;
     temporizador de  const =  setInterval (
      ip  => {
        http
          . get ( ' http: // '  + ip, res  => {
            const  statusCode  =  res . statusCode ;
            if (statusCode ===  200  && esperando) {
              esperando =  falso ;
              clearTimeout (temporizador);
              // El servidor HTTP está listo.
              consola . log ( ' ¡Listo! ' );
              consola . log (ip);
            }
          })
          . en ( ' error ' , () => {
            // El servidor HTTP no está listo todavía.
            proceso . la salida estándar . escribir ( ' . ' );
          });
      }
      2000 ,
      ip
    );
  }
  atrapar (error) {
    consola . error (error);
  }
}) ();
