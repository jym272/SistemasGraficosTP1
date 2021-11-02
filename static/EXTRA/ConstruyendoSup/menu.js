function SubFolder(gui_folder) {
    let Superficies = new Set();
    this.agregarSuperficie = function (unaSuperficie) {
        Superficies.add(unaSuperficie);
    };
    let superficieActual = undefined;
    let execute;

    this.doItOnce = function (unaSuperficie) {
        // Si cambia de superficie en los infinitos llamados se resetea
        // la funcion anonima menuEnPantalla(solo se ejectua una vez)
        // execute = (unaSuperficie === superficieActual) ? true : false;
        execute = (unaSuperficie === superficieActual);
        if (Superficies.has(unaSuperficie))
            superficieActual = unaSuperficie;
        else
            console.log("Esta superficie no se encuentra cargada");
        menuEnPantalla();
    };
    let removerMenuAnterior = function () {
        if (typeof gui_folder.menuFolder != "undefined") {
            gui_folder.gui.removeFolder(gui_folder.menuFolder);
            gui_folder.menuFolder = undefined;
        }
    }
    let menuEnPantalla = (function () {
        execute = false;
        return function () {
            if (!execute) {
                execute = true; //solo ingreso una vez a menos que setee false desde afuera
                removerMenuAnterior();
                superficieActual.cargarSubMenu(gui_folder);
            }
        };
    })();
}
class SubFolderSuperficieParametrica{
    constructor(nombre) {
        this.nombre = nombre; //realmente no importa el nombre, se borra el gui en cada superf
    }
    cargarSubMenu(gui_folder){
        gui_folder.menuFolder = gui_folder.gui.addFolder(this.nombre);
        this.cargarCaracteristicasAlSubMenu(gui_folder)
        gui_folder.menuFolder.open();
    }
    //metodo abstracto, lo tengo que sobrecargar
    cargarCaracteristicasAlSubMenu(gui_folder) {
    }
}
class SubFolderCilindro extends SubFolderSuperficieParametrica{
    constructor() {
        super("Cilindro");
    }
    cargarCaracteristicasAlSubMenu(gui_folder){
        gui_folder.menuFolder.add(window, "amplitudCilindro", 0.1, 0.4).step(0.01);
        gui_folder.menuFolder.add(window, "longitudDeOndaCilindro", 1, 10).step(1);
        gui_folder.menuFolder.add(window, "alturaCilindro", 1, 5).step(0.2);
        gui_folder.menuFolder.add(window, "radioCilindro", 0.1, 2).step(0.1);
    }
}
class SubFolderPlano extends SubFolderSuperficieParametrica{
    constructor() {
        super("Plano");
    }
    cargarCaracteristicasAlSubMenu(gui_folder){
        gui_folder.menuFolder.add(window, "anchoPlano", 0, 6).step(0.1);
        gui_folder.menuFolder.add(window, "largoPlano", 0, 6).step(0.1);
    }
}
class SubFolderEsfera extends SubFolderSuperficieParametrica{
    constructor() {
        super("Esfera");
    }
    cargarCaracteristicasAlSubMenu(gui_folder){
        gui_folder.menuFolder.add(window, "radioEsfera", 0, 2).step(0.1);
    }
}

function initMenu() {
    let gui_folder = {
        gui: new dat.GUI(),
        menuFolder: undefined,
    };
    //menu fijo
    this.show = function () {
        gui_folder.gui.add(window, "distanciaCamara", 0.01, 5).step(0.01);
        gui_folder.gui.add(window, "alturaCamara", -4, 4).step(0.01);
        gui_folder.gui.add(window, "velocidadAngular", 0, 1).step(0.01);
        gui_folder.gui.add(window, "filas", 0, 50).step(1);
        gui_folder.gui.add(window, "columnas", 0, 50).step(1);
        gui_folder.gui.add(window, "modo", ["wireframe", "smooth", "edges"]);
        gui_folder.gui.add(window, "superficieParametrica", ["cilindro", "plano", "esfera"]);

    }
    let subMenu = new SubFolder(gui_folder);
    subMenu.agregarSuperficie(esfera = new SubFolderEsfera());
    subMenu.agregarSuperficie(cilindro = new SubFolderCilindro());
    subMenu.agregarSuperficie(plano = new SubFolderPlano());

    //infinitos llamados a una de las tres funciones en el programa, se ejecuta metodo anonimo solo una vez
    this.showSubfolderEsfera = function () {
        subMenu.doItOnce(esfera);
    }
    this.showSubfolderPlano = function () {
        subMenu.doItOnce(plano);
    }
    this.showSubfolderCilindro = function () {
        subMenu.doItOnce(cilindro);
    }
}