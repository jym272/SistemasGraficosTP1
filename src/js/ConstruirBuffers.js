'use strict';

export class ConstruirBuffers{
    // Constructor
    constructor(dimensionesTriangulos) {
    this.dimensionesTriangulos = dimensionesTriangulos;
    }
   // Método que construye los buffers
   construir(superficie){
       const positionBuffer = [];
       const normalBuffer = [];
       const uvBuffer = [];
       const tangenteBuffer = [];
       for (let i = 0; i <= this.dimensionesTriangulos.filas; i++) {
           for (let j = 0; j <=  this.dimensionesTriangulos.columnas; j++) {
               let u = j /  this.dimensionesTriangulos.columnas;
               let v = i /  this.dimensionesTriangulos.filas;

               let pos = superficie.getPosicion(u, v);

               positionBuffer.push(pos[0]);
               positionBuffer.push(pos[1]);
               positionBuffer.push(pos[2]);
               
               let uvs = superficie.getCoordenadasTextura(u, v);

               uvBuffer.push(uvs[0]);
               uvBuffer.push(uvs[1]);

               let tan = superficie.getTangente(u, v);

                tangenteBuffer.push(tan[0]);
                tangenteBuffer.push(tan[1]);
                tangenteBuffer.push(tan[2]);


               let nrm = superficie.getNormal(u, v);


               normalBuffer.push(nrm[0]);
               normalBuffer.push(nrm[1]);
               normalBuffer.push(nrm[2]);

              

           }
       }

       // Buffer de indices de los triángulos
       //  (i,j) , (i, j+1) , (i+1, j+1), (i+1, j)
       const verticesPorFila =  this.dimensionesTriangulos.columnas + 1;
       const indexBuffer = [];

       for (let i = 0; i <  this.dimensionesTriangulos.filas; i++) {
           for (let j = 0; j <  this.dimensionesTriangulos.columnas + 1; j = j + 2) {
               indexBuffer.push(i * verticesPorFila + j);
               indexBuffer.push((i + 1) * verticesPorFila + j);
               indexBuffer.push(i * verticesPorFila + j + 1);
               indexBuffer.push((i + 1) * verticesPorFila + j + 1);
           }
           const l = indexBuffer.length;
           if (!( this.dimensionesTriangulos.columnas % 2)) { //se corrige las dos ultimas posiciones antes de ir a la sig fila
               //si columnas es par
               indexBuffer[l - 1] = indexBuffer[l - 2];
               indexBuffer[l - 2] = indexBuffer[l - 3];
           } else { //si columnas es impar se agrega dos indices antes de continuar
               indexBuffer.push(indexBuffer[l - 1]);
               indexBuffer.push((i + 1) * verticesPorFila + 0); //el sig indice es
               //la iteracion con i+1 y con j=0.
           }
       }
       indexBuffer.pop(); indexBuffer.pop(); //las dos ultimas pos son innecesarias ya que no quedan filas

       //malla de triangulos
       return {
           positionBuffer,
           normalBuffer,
           uvBuffer,
           indexBuffer,
           tangenteBuffer,
       };
   }
}
