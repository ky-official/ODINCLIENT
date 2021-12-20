import { Space } from './shared/interfaces/space';
import { Guidespace, SELECTION_MODE, PLACEMENT_MODE } from './guidespace';
import { Project, ObjectLiteralExpression, PropertyAssignment, ShorthandPropertyAssignmentStructure, StructureKind } from 'ts-morph';
import { TemplateEditors } from './shared/templateEditor'
import ResizeObserver from 'resize-observer-polyfill';
import * as xmlDom from 'xmldom'
import { HistoryService, OPERTATION_MODE, OPERTATION_TYPE, State } from './shared/historyService';
import { Toolspace } from './toolspace';
import store from "@/store";


var instance: Workspace;


export enum GUIDE_DIRECTION {
    TOP, RIGHT, BOTTOM, LEFT
}

export class Workspace implements Space {

    root: HTMLIFrameElement;
    resizeObserver?: ResizeObserver;
    historyService: HistoryService;
    selected: Array<HTMLElement> = new Array();
    scale = 0
    private dz = require("./lib/detect-zoom");


    private constructor(iframe: HTMLIFrameElement) {

        this.root = iframe;
        this.historyService = HistoryService.getInstance()
        this.toggleAll(iframe.contentDocument!.body)
        this.registerHooks();
        //Disable context menu
        iframe.contentDocument?.body.setAttribute('oncontextmenu', 'return false');
        iframe.contentWindow?.focus();
        //iframe.contentDocument!.designMode = "on"

        //this.testXmlDom();

    }
    testXmlDom() {
        var template =
            `
            <template>
            <div class="hello">lasdfsdfsdfljlj</div>
            <div class="jiop">
              {{ msg }}
              <input @change="change" type="number" name="" id="in" />
          
              <iframe
                @load="loaded"
                src="/in.html"
                id="workspace"
                frameborder="0"
              ></iframe>
          
            </div>
          </template>

        `
        var script =
            `
        import { Options, Vue } from "vue-class-component";
        import { Workspace } from "../services/workspace";
        import { StyleParser } from "../services/lib/styleParser";
        import { Guidespace, SELECTION_MODE } from "../services/guidespace";
        import ColorPicker from "vue3-ts-picker";

        @Options({
        props: {},
        components: {
            ColorPicker,
        },
        })
        export default class HelloWorld extends Vue {
        styleSheet!: HTMLStyleElement;
        root!: HTMLIFrameElement;
        resizeObserver?: ResizeObserver;
        styleParser!: StyleParser;
        styleCache: Array<string> = new Array();
        selected!: Array<HTMLElement>;
        shiftDown = false;
        ctrlDown = false;
        mouseDown = false;
        wasDragging = false;
        wasSelecting = false;
        start = [0, 0];
        offset = [0, 0];
        gs!: Guidespace;
        currentEditable!: HTMLElement;
        top = 0;
        color = "";

        changeColor(color: string) {
            console.log(color);
            if (this.selected!== undefined) {
            this.selected.forEach((elt) => {
                elt.classList.add("omo");
            });
            

            this.styleParser.update(".omo", "background-color", color);

            this.styleSheet.innerHTML = this.styleParser.print()
            ? (this.styleParser.print() as string)
            : "";

            this.gs.clear();
            this.gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
            }
        }
    }
        `

        //ts morph
        let project = new Project({
            useInMemoryFileSystem: true
        })
        const src = project.createSourceFile('', script);

        //get import statement declaration from "module specifier"
        let declaration = src.getImportDeclaration(impdec => {
            if (impdec.getModuleSpecifierValue() == "vue3-ts-picker")
                return true
            return false
        })

        declaration!.remove()

        //add new component to component objects
        const structure: ShorthandPropertyAssignmentStructure = {
            kind: StructureKind.ShorthandPropertyAssignment,
            name: "SomeComponent"
        };
        //edit component object
        src.getClasses()[0].getDecorator('Options')?.getCallExpression()?.getArguments().forEach(arg => {
            if (arg instanceof ObjectLiteralExpression) {
                const obe = arg as ObjectLiteralExpression
                const components = obe.getProperty("components") as PropertyAssignment
                const initializer = components.getInitializer()
                if (initializer instanceof ObjectLiteralExpression) {
                    const parameters = initializer as ObjectLiteralExpression
                    parameters.addProperty(structure)
                    parameters.getProperty("ColorPicker")?.remove()
                    parameters.getProperty("SomeComponent")?.remove()
                }


                // parameters.getProperty("ColorPicker")?.remove();
            }

        })


        console.log(src.print());







        //----------------------------------------------------------------------\\




        //! line 604 sax.js : disable invalid attribute check
        //! add below function to dom.js functions
        /*
            getElementsByAttributeValue: function(attribute,value) {
        var pattern = new RegExp("(^|\\s)" + value + "(\\s|$)");
        return new LiveNodeList(this, function(base) {
            var ls = [];
            _visitNode(base.documentElement, function(node) {
                if(node !== base && node.nodeType == ELEMENT_NODE) {
                    if(node.getAttribute(attribute) && pattern.test(node.getAttribute(attribute))) {
                        ls.push(node);
                    }
                }
            });
            return ls;
        });
        },
          */

        let parser = xmlDom.DOMParser;
        let serializer = xmlDom.XMLSerializer;

        const templateRegex = /(<template(\s|\S)*<\/template>)/gm;
        const importRegex = /(?<=<script)(>)(\s*)(?=(\s|\S))/gm;
        const addRegex = /(?<=<script>(\s|\S)*components:(\s)*)({)(\s*)/gm;
        const remXmlns = /[\w]*xmlns(\s|\S)*?"(\s|\S)*?"/gm;

        let document = new parser().parseFromString(template.match(templateRegex)![0], 'text/html');
        let child = new parser().parseFromString(`<divo> asfasfk </divo>`);


        let root = document.getElementsByClassName("hello").item(0);
        let elts = document.getElementsByTagNameNS('*', '*')
        document.getElementsByTagNameNS

        //CCS element registration 
        for (let i = 0; i < elts.length; i++) {
            const elt = elts.item(i)
            if (elt!.tagName != 'template')
                elt!.setAttribute('od-data-id', 'omo')
        }
        //   console.log((document as any).getElementsByAttributeValue('od-data-id', 'omo'))

        let sibling = root?.childNodes.item(1);
        root?.insertBefore(child, sibling!);
        let output = new serializer().serializeToString(document!);

        // source = source.replace(tempRegex, output);
        // source = source.replace(importRegex, ">\nimport MessageBox from './MessageBox';\n");
        // source = source.replace(addRegex, "{" + "MessageBox" + ",");
        output = output.replace(remXmlns, "");

        //   console.log(output);




    }


    getRoot(): HTMLElement {
        return this.root;
    }

    resetSelected() {
        this.selected.splice(0)
        Guidespace.getInstance().clear()
    }

    /**
   * @registerHooks attaches hooks for disabling the window context menu,
   * resetting the guidespace on window resize, dragging and dropping elements,
   * highlighting on mouse over, highlighting  and placement on dragover
   */
    registerHooks() {

        const iframe = this.root;
        Guidespace.init(iframe);

        var gs = Guidespace.getInstance();
        var ts = Toolspace.getInstance();
        var dragging = false;
        var altDown = false;
        var shiftDown = false;
        var ctrlDown = false
        var lkeyDown = false;
        var pkeyDown = false;
        var dkeyDown = false;
        var mouseDown = false;
        var editing = false;
        var wasDragging = false;
        var wasSelecting = false;

        var currentDraggable: HTMLElement | undefined;
        var currentDropZoneElt: ChildNode | HTMLElement | undefined;
        var currentPlacement: PLACEMENT_MODE | undefined;
        var currentEditable!: HTMLElement | undefined;


        var start = [0, 0];
        var offset = [0, 0];
        var top = 0;
        var color = "";
        var display = "";

        let startHtml: string




        //Scrollbar.init(iframe.contentDocument!.querySelector('body')! );

        window.addEventListener('resize', (ev) => {

            if (window.innerWidth < 1200) {
                store.commit('setAppState', { disabled: true, message: "Window Width is too Small!!" })
            }


        })

        document.querySelector("#workspace")?.addEventListener('mouseleave', e => {
            gs.clear()
            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
        })

        //Resize Hook using the ResizeObserver api
        this.resizeObserver = new ResizeObserver((entries: any) => {

            const zoomRatio = this.getPixelRatio()
            // console.log('window zoom level: ' + Math.round(zoomRatio * 100) + '%');
            gs.reset(false)
            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)

        });
        //Observe the body's size
        this.resizeObserver.observe(iframe.contentDocument?.querySelector('body')!)

        // this.scaleWorkspace(1500)
        //Redraw guidespace on scroll
        iframe.contentWindow!.onscroll = (e) => {
            gs.clear()
            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
        }

        /**
        * @dbclick hook sets the contenteditable attribute
        * of an element to true
        */
        this.root.contentDocument!.addEventListener("dblclick", (e) => {
            editing = true;
            var elt = e.target as HTMLElement;
            if (currentEditable !== elt && !this.checkLocked(elt)) {

                startHtml = elt.innerHTML
                currentEditable = elt;
                display = elt.style.display.toString();
                elt.setAttribute("contenteditable", "true");
                elt.style.cursor = "text";
                elt.style.display = "inline-block";
                elt.focus();
                Workspace.getInstance().toggleDraggable(elt, true);
                gs.clear();
                gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
            }
        });

        /**
        * @click hook handles different selecting modes: direct, parent and multiselecting.
        * It also resets all elements with the contenteditable attribute to true
        */
        this.root.contentDocument!.addEventListener("click", (e: MouseEvent) => {
            var elt = e.target! as HTMLElement;

            //Select parent
            if (altDown && elt.parentElement) {
                elt = elt.parentElement;
            }

            //Reset contenteditable
            if (currentEditable && elt != currentEditable) {

                if (startHtml !== currentEditable.innerHTML) {
                    this.saveDomTextUpdateToHistory(currentEditable, startHtml, currentEditable.innerHTML)
                }

                editing = false;
                Workspace.getInstance().toggleDraggable(currentEditable, true);
                currentEditable.setAttribute("contenteditable", "false");
                currentEditable.style.display = display;
                currentEditable.style.cursor = "initial";
                currentEditable = undefined;


            }

            //Single selection. If previous action was multiselection, then reset.
            if (
                !["body", "html"].includes(elt.tagName.toLowerCase()) &&
                !ctrlDown
            ) {
                if (!this.selected.includes(elt) && this.selected.length <= 1) {
                    this.selected.splice(0, this.selected.length);
                    this.selected.push(elt);
                } else if (this.selected.length > 1) {
                    this.selected.splice(0, this.selected.length);
                    this.selected.push(elt);
                }

                //Manual multiselection using the control modifier key
            } else if (
                !["body", "html"].includes(elt.tagName.toLowerCase()) &&
                ctrlDown
            ) {
                if (!this.selected.includes(elt)) {
                    this.selected.push(elt);
                } else {
                    this.selected.splice(this.selected.indexOf(elt), 1);
                }
            }
            gs.clear();
            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
            ts.setSelected(this.selected) // set selected elements in toolspace

            //Handler overrides: prevent all handlers in workspace document from being called
            e.stopPropagation();
            e.preventDefault();
        },
            // Make hook alpha
            true
        );

        /**
         * @mousedown hook gets starting position data for multiselection
         * overlay and
         * experimental position styling with shift modifier
         */
        this.root.contentDocument!.addEventListener(
            "mousedown",
            (e: MouseEvent) => {
                if (shiftDown) {
                    var elt = e.target! as HTMLElement;
                    if (this.selected.includes(elt)) {
                        this.selected.forEach((element) => {
                            if (!element.style.position) element.style.position = "relative";
                        });

                        mouseDown = true;
                        offset = [
                            parseInt(this.root.contentWindow!.getComputedStyle(elt).left) ||
                            0,
                            parseInt(this.root.contentWindow!.getComputedStyle(elt).top) || 0,
                        ];
                        start = [
                            e.clientX - offset[0],
                            e.clientY - offset[1],
                        ];
                    }
                } else if (ctrlDown) {
                    //multiselect
                    mouseDown = true;
                    start = [e.clientX, e.clientY];
                    console.log(start);

                }
            }
        );
        /**
         * @mouseup hook gets end position after multiselection operation
         */
        this.root.contentDocument!.addEventListener(
            "mouseup",
            (event: MouseEvent) => {
                if (mouseDown) {
                    mouseDown = false;

                    if (wasDragging) {
                        wasDragging = false;
                    } else if (wasSelecting) {
                        wasSelecting = false;
                        this.selected.splice(0, this.selected.length);

                        this.walkTheDOM(this.root.contentDocument?.body as Node, (node) => {
                            const elt = node as HTMLElement;

                            if (!["body", "html"].includes(elt.tagName.toLowerCase()) &&
                                !Toolspace.getInstance().checkLocked(elt)) {
                                    
                                const rect = elt.getBoundingClientRect();
                                var x = start[0];
                                var y = start[1];
                                var w = event.x - x;
                                var h = event.y - y;

                                //hit detection
                                if (w < 0 && h >= 0) {
                                    x = event.x;
                                    w = -w;
                                } else if (h < 0 && w >= 0) {
                                    y = event.y;
                                    h = -h;
                                } else if (w < 0 && h < 0) {
                                    x = event.x;
                                    w = -w;
                                    y = event.y;
                                    h = -h;
                                }

                                if (
                                    rect.x < x + w &&
                                    rect.x + rect.width > x &&
                                    rect.y < y + h &&
                                    rect.height + rect.y > y
                                ) {
                                    this.selected.push(elt);
                                }

                                return false;
                            }

                            return true;
                        });
                        gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
                    }
                    start = [];
                }
            }
        );

        /** 
         * @mousemove hook gets current position data for multiselection
         * overlay, draws highlights on hovered elements and
         * experimental positioning with shift modifier
         */
        this.root.contentDocument!.addEventListener(
            "mousemove",
            (e: MouseEvent) => {
                const elt = e.target as HTMLElement;

                if (mouseDown && shiftDown) {
                    this.selected.forEach((elt) => {
                        elt.classList.add("omo");
                    });

                    wasDragging = true;

                    var delX = e.clientX - start[0];
                    var delY = e.clientY - start[1];

                    top = delY;
                    /*  this.styleParser.update(".omo", "left", delX + "px");
                    this.styleParser.update(".omo", "top", delY + "px");
          
                    //todo:should be a function
                    this.styleSheet.innerHTML = this.styleParser.print()
                      ? (this.styleParser.print() as string)
                      : ""; */
                } else if (mouseDown && ctrlDown) {
                    // console.log('moving mouse with control');

                    wasSelecting = true;
                    gs.clear();
                    gs.drawOverlay([...start, e.clientX, e.clientY]);
                }
                else if (!dragging) {
                    gs.clear()
                    if (!this.selected.includes(elt))
                        gs.drawSelected([elt], SELECTION_MODE.HIGHLIGHT)
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                }
            },
            // Make hook alpha
            true
        );

        /**
         * @dragstart hook overrides default drag behaviour if modifiers
         * are active and hook sets the currentDraggable to valid target
         * and prevents default if not valid
         */
        this.root.contentDocument!.addEventListener("dragstart", (e: MouseEvent) => {
            iframe.focus()
            const elt = e.target as HTMLElement;
            if (elt.getAttribute("odin-locked") !== "true" && !(shiftDown || ctrlDown) && !editing) {
                dragging = true;
                currentDraggable = elt
                this.toggleDropZone(currentDraggable, false, false)
                if (!this.selected.includes(elt)) {
                    this.selected.splice(0, this.selected.length)
                    this.selected.push(elt);
                }
            }
            else {
                console.log("stopiing prop");

                e.preventDefault()
                e.stopPropagation()
                return false
            }

        },
            //Make hook alpha
            true
        );


        /**
         * @ondragend resets the dragging flag and toggles dropzone
         * attribute of currentDraggable
         */
        iframe.contentDocument!.ondragend = (e) => {
            dragging = false;
            e.stopPropagation()
            e.preventDefault()
            gs.clear()
            this.toggleDropZone(currentDraggable!, false, true);
        }

        /**
         * @ondrop hook inserts currentDraggable at current placement position.
         * If alt modifier is used, currentDraggable is duplicated and inserted
         * else it is removed from original position and inserted
         */
        iframe.contentDocument!.ondrop = (e) => {
            e.stopPropagation()
            e.preventDefault()
            gs.clear()

            if ((currentDropZoneElt != undefined) && (currentPlacement != undefined)) {

                let source: HTMLElement

                if (altDown) source = currentDraggable?.cloneNode(true) as HTMLElement
                else source = currentDraggable as HTMLElement

                if (!altDown) this.saveDomUpdateToHistory(currentDropZoneElt as HTMLElement, source, currentPlacement)
                else this.saveDomCreateToHistory(currentDropZoneElt as HTMLElement, source, currentPlacement)

                TemplateEditors.placeInDOM(currentDropZoneElt, source!, currentPlacement, altDown)

                currentPlacement = undefined;
                currentDropZoneElt = undefined;
            }

        }

        iframe.contentDocument!.querySelectorAll('*').forEach((e) => {
            var elt = e as HTMLElement;

            /**
             * @ondragover hook calculates and finds valid placement positions for currentDraggable.
             * Also draws placement and context guides using the Guidespace
             */
            elt.ondragover = (e) => {

                var isbody = false;
                e.stopPropagation()
                e.preventDefault();

                const rect = elt.getBoundingClientRect();
                var mousePercents = this.getMousePercents(e, rect);
                const threshold = 5

                currentPlacement = undefined;
                currentDropZoneElt = undefined;

                //Inside element
                if ((mousePercents.x > threshold && mousePercents.x < 100 - threshold)
                    && (mousePercents.y > threshold && mousePercents.y < 100 - threshold) && !this.validateElement(elt)) {


                    //Empty elements
                    if (elt.innerHTML == "") {
                        gs.clear()
                        gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                        gs.drawSelected([elt], SELECTION_MODE.HIGHLIGHT)
                        if (elt.getAttribute('dropzone') == 'true') {
                            currentDropZoneElt = elt
                            currentPlacement = PLACEMENT_MODE.INSIDE
                        }
                    }
                    //Element with only text
                    else if (elt.children.length == 0) {
                        gs.clear()
                        gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                        gs.drawSelected([elt], SELECTION_MODE.HIGHLIGHT)

                        mousePercents = this.getMousePercents(e, elt.getBoundingClientRect())

                        if (mousePercents.y < 50) {

                            if (elt.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = elt
                                currentPlacement = PLACEMENT_MODE.INSIDE_BEFORE
                            }
                        }
                        else {
                            if (elt.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = elt
                                currentPlacement = PLACEMENT_MODE.INSIDE_AFTER
                            }
                        }

                    }
                    //Inside element with child elements
                    else {

                        const closestChild = this.findClosestElement(elt, e.clientX, e.clientY)

                        mousePercents = this.getMousePercents(e, closestChild.getBoundingClientRect())
                        const display = this.getDisplayType(closestChild);
                        orientation = (display == 'inline' || display == 'inline-block')

                        if (!closestChild.isSameNode(currentDraggable!)) {
                            if (!orientation) {
                                if (mousePercents.y < 50) {
                                    gs.clear()
                                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                                    gs.drawPlacement(closestChild, PLACEMENT_MODE.BEFORE)
                                    if (elt.getAttribute('dropzone') == 'true') {
                                        currentDropZoneElt = closestChild
                                        currentPlacement = PLACEMENT_MODE.BEFORE
                                    }
                                }
                                else {
                                    gs.clear()
                                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                                    gs.drawPlacement(closestChild, PLACEMENT_MODE.AFTER)
                                    if (elt.getAttribute('dropzone') == 'true') {
                                        currentDropZoneElt = closestChild
                                        currentPlacement = PLACEMENT_MODE.AFTER
                                    }
                                }
                            }

                            else {
                                if (mousePercents.x < 50) {
                                    gs.clear()
                                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                                    gs.drawPlacement(closestChild, PLACEMENT_MODE.BEFORE_LEFT)
                                    if (elt.getAttribute('dropzone') == 'true') {
                                        currentDropZoneElt = closestChild
                                        currentPlacement = PLACEMENT_MODE.BEFORE
                                    }
                                }
                                else {
                                    gs.clear()
                                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                                    gs.drawPlacement(closestChild, PLACEMENT_MODE.AFTER_RIGHT)
                                    if (elt.getAttribute('dropzone') == 'true') {
                                        currentDropZoneElt = closestChild
                                        currentPlacement = PLACEMENT_MODE.AFTER
                                    }
                                }
                            }

                        }
                    }



                }

                //element boudaries of left and top
                else if ((mousePercents.x <= threshold) || (mousePercents.y <= threshold)) {

                    var valid
                    var orientation
                    if (mousePercents.y <= mousePercents.x) {
                        //top zone
                        valid = this.findValidParent(elt, GUIDE_DIRECTION.TOP)
                    }
                    else {
                        //left zone
                        valid = this.findValidParent(elt, GUIDE_DIRECTION.LEFT)
                    }

                    if (["body", "html"].includes(valid!.tagName.toLowerCase())) {
                        valid = iframe.contentDocument?.body.firstElementChild
                        isbody = true
                    }



                    //decide
                    valid = valid! as HTMLElement
                    mousePercents = this.getMousePercents(e, valid.getBoundingClientRect())
                    const display = this.getDisplayType(valid);
                    orientation = (display == 'inline' || display == 'inline-block')

                    if (!valid.isSameNode(currentDraggable!)) {
                        if (!orientation) {
                            gs.clear()
                            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                            gs.drawPlacement(valid, PLACEMENT_MODE.BEFORE)
                            if (isbody) {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.BEFORE
                            }
                            if (elt.parentElement!.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.BEFORE
                            }
                        }

                        else {
                            gs.clear()
                            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                            gs.drawPlacement(valid, PLACEMENT_MODE.BEFORE_LEFT);
                            if (isbody) {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.BEFORE
                            }
                            if (elt.parentElement!.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.BEFORE
                            }
                        }

                    }
                }

                //element boudaries of right and bottom
                else if ((mousePercents.x >= 100 - threshold) || (mousePercents.y >= 100 - threshold)) {
                    var valid
                    if (mousePercents.y >= mousePercents.x) {
                        valid = this.findValidParent(elt, GUIDE_DIRECTION.BOTTOM)
                    }
                    else {
                        valid = this.findValidParent(elt, GUIDE_DIRECTION.RIGHT)
                    }
                    if (["body", "html"].includes(valid!.tagName.toLowerCase())) {
                        valid = iframe.contentDocument?.body.lastElementChild;
                        isbody = true;
                    }

                    //decide
                    valid = valid! as HTMLElement
                    mousePercents = this.getMousePercents(e, valid.getBoundingClientRect())
                    const display = this.getDisplayType(valid);
                    orientation = (display == 'inline' || display == 'inline-block')

                    if (!valid.isSameNode(currentDraggable!)) {
                        //horizontal
                        if (!orientation) {
                            gs.clear()
                            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                            gs.drawPlacement(valid, PLACEMENT_MODE.AFTER)
                            if (isbody) {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.AFTER
                            }
                            else if (elt.parentElement!.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.AFTER
                            }
                        }
                        else {
                            gs.clear()
                            gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                            gs.drawPlacement(valid, PLACEMENT_MODE.AFTER_RIGHT)
                            if (isbody) {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.AFTER
                            }
                            else if (elt.parentElement!.getAttribute('dropzone') == 'true') {
                                currentDropZoneElt = valid
                                currentPlacement = PLACEMENT_MODE.AFTER
                            }
                        }
                    }
                }


            }
        });
        /**
         * @keydown hook handles key events to set modifier
         * flags, handle element locking and handle Parent selecting
         */
        iframe.contentDocument!.addEventListener("keydown", (e: KeyboardEvent) => {

            if (e.shiftKey && !shiftDown) {
                shiftDown = true;
            } else if (e.ctrlKey && !ctrlDown) {
                ctrlDown = true;
            } else if (e.altKey && !altDown) {
                altDown = true;
            }
            else if (e.key === "z" && ctrlDown) {
                if (!editing) {
                    e.preventDefault();
                    if (altDown) {
                        this.historyService.redo();
                    } else this.historyService.undo();
                    gs.clear();
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
                }
            }
            else if (e.key === "Delete") {
                this.selected.forEach(elt => {
                    this.saveDomDeleteToHistory(elt)
                    TemplateEditors.deleteInDOM(elt)
                });
                gs.clear()
                gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
            }
            else if (!lkeyDown && e.key === "l") {

                if (ctrlDown && !altDown) {
                    e.preventDefault()
                    lkeyDown = true

                    this.selected.forEach(elt => {
                        if (!elt.hasAttribute("odin-locked"))
                            elt.setAttribute('odin-locked', 'false')
                        this.toggleLock(elt, true);
                        this.toggleDropZone(elt, true)
                    })
                    gs.clear()
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)

                }
                //lock element and children
                else if (ctrlDown && altDown) {
                    e.preventDefault()
                    lkeyDown = true

                    if (this.selected.length > 1)
                        console.log(' locking does not work with multiselection');
                    var elt = this.selected[0]
                    if (elt) {
                        if (!elt.hasAttribute("odin-locked"))
                            elt.setAttribute('odin-locked', 'false')
                        this.toggleLock(elt, false);
                        this.toggleDropZone(elt, false)
                    }
                    gs.clear()
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                }

            }
            else if (!pkeyDown && e.key === "p") {


                //parent selecting
                if (ctrlDown && this.selected.length == 1) {
                    e.preventDefault()
                    pkeyDown = true
                    var elt = this.selected[0]
                    if (elt && elt.parentElement) {
                        this.selected[0] = elt.parentElement;
                        gs.clear()
                        gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                    }
                }
            }
            else if (!dkeyDown && e.key === "d") {


                //duplicate element
                if (ctrlDown) {
                    e.preventDefault()
                    dkeyDown = true
                    this.selected.forEach(elt => {
                        if (elt && elt.parentElement) {
                            const dup = elt.cloneNode(true)
                            this.saveDomCreateToHistory(elt, dup as HTMLElement, PLACEMENT_MODE.AFTER)
                            elt.after(dup)

                        }
                    })
                }
                gs.clear()
                gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
            }
        }
        );
        /**
         * @keyup hook handles key events to set modifier
         * flags
         */
        iframe.contentDocument!.addEventListener("keyup", (e: KeyboardEvent) => {
            if (shiftDown && !e.shiftKey) {
                shiftDown = false;
            } else if (!e.ctrlKey && ctrlDown) {
                ctrlDown = false;
            } else if (!e.altKey && altDown) {
                altDown = false;
            }
            else if (lkeyDown && e.key === "l") {
                lkeyDown = false;
            }
            else if (pkeyDown && e.key === "p") {
                pkeyDown = false;
            }
            else if (dkeyDown && e.key === "d") {
                dkeyDown = false;
            }
        });

        document.addEventListener("keydown", (e: KeyboardEvent) => {

            if (e.shiftKey && !shiftDown) {
                shiftDown = true;
            } else if (e.ctrlKey && !ctrlDown) {
                ctrlDown = true;
            } else if (e.altKey && !altDown) {
                altDown = true;
            }
            else if (e.key === "z" && ctrlDown) {
                if (!editing) {
                    e.preventDefault();
                    if (altDown) {
                        this.historyService.redo();
                    } else this.historyService.undo();
                    gs.clear();
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT);
                }
            }
            /* else if (e.key === "Delete") {
                this.selected.forEach(elt => {
                    this.saveDomDeleteToHistory(elt)
                    TemplateEditors.deleteInDOM(elt)
                });
                gs.clear()
                gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
            } */
            else if (!lkeyDown && e.key === "l") {

                if (ctrlDown && !altDown) {
                    e.preventDefault()
                    lkeyDown = true

                    this.selected.forEach(elt => {
                        if (!elt.hasAttribute("odin-locked"))
                            elt.setAttribute('odin-locked', 'false')
                        this.toggleLock(elt, true);
                        this.toggleDropZone(elt, true)
                    })
                    gs.clear()
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)

                }
                //lock element and children
                else if (ctrlDown && altDown) {
                    e.preventDefault()
                    lkeyDown = true

                    if (this.selected.length > 1)
                        console.log(' locking does not work with multiselection');
                    var elt = this.selected[0]
                    if (elt) {
                        if (!elt.hasAttribute("odin-locked"))
                            elt.setAttribute('odin-locked', 'false')
                        this.toggleLock(elt, false);
                        this.toggleDropZone(elt, false)
                    }
                    gs.clear()
                    gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                }
            }
            else if (!pkeyDown && e.key === "p") {


                //parent selecting
                if (ctrlDown && this.selected.length == 1) {
                    e.preventDefault()
                    pkeyDown = true
                    var elt = this.selected[0]
                    if (elt && elt.parentElement) {
                        this.selected[0] = elt.parentElement;
                        gs.clear()
                        gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
                    }
                }
            }
            else if (!dkeyDown && e.key === "d") {


                //duplicate element
                if (ctrlDown) {
                    e.preventDefault()
                    dkeyDown = true
                    this.selected.forEach(elt => {
                        if (elt && elt.parentElement) {
                            const dup = elt.cloneNode(true)
                            this.saveDomCreateToHistory(elt, dup as HTMLElement, PLACEMENT_MODE.AFTER)
                            elt.after(dup)

                        }
                    })
                }
                gs.clear()
                gs.drawSelected(this.selected, SELECTION_MODE.MULTISELECT)
            }
        }
        );

        document.addEventListener("keyup", (e: KeyboardEvent) => {
            if (shiftDown && !e.shiftKey) {
                shiftDown = false;
            } else if (!e.ctrlKey && ctrlDown) {
                ctrlDown = false;
            } else if (!e.altKey && altDown) {
                altDown = false;
            }
            else if (lkeyDown && e.key === "l") {
                lkeyDown = false;
            }
            else if (pkeyDown && e.key === "p") {
                pkeyDown = false;
            }
            else if (dkeyDown && e.key === "d") {
                dkeyDown = false;
            }
        });

    }

    walkTheDOM(start: Node, func: (node: Node) => boolean) {
        const dive = func(start);
        var node = dive ? start.firstChild! : start.nextSibling;
        while (node) {
            this.walkTheDOM(node, func);
            node = node.nextSibling!;
        }
    }

    scaleWorkspace(width: number) {
        const rect = this.root.parentElement?.getBoundingClientRect()!
        const root = this.root;
        if (width > rect.width) {
            this.scale = rect.width / width;

            root.style.transform = `scale(${this.scale})`;
            root.style.transformOrigin = `0px 0px`;

            root.style.minWidth = width + "px";
            root.style.minHeight = rect.height / this.scale + "px";
        }

    }
    generateID(): string {
        let s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };
        var gid = s4() + s4() + "_" + s4();
        return gid;
    }
    saveDomTextUpdateToHistory(element: HTMLElement, previousText: string, text: string) {
        const state: State = {
            operationType: OPERTATION_TYPE.DOM,
            operationMode: OPERTATION_MODE.UPDATE_TEXT,
            operands: {
                element: element,
                previousText: previousText,
                text: text
            }
        }
        this.historyService.push(state)
    }
    saveDomUpdateToHistory(relative: HTMLElement, element: HTMLElement, mode: PLACEMENT_MODE) {
        switch (mode) {
            case PLACEMENT_MODE.BEFORE: {

                const previousSibling = element.nextElementSibling
                const previousParent = element.parentElement
                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.UPDATE,
                    operands: {
                        element: element,
                        previousSibling: previousSibling,
                        previousParent: previousParent,
                        parent: undefined,
                        sibling: relative,
                    }
                }
                this.historyService.push(state)

            }

                break;


            case PLACEMENT_MODE.AFTER: {
                const previousSibling = element.nextElementSibling
                const previousParent = element.parentElement
                const parent = relative.parentElement
                const sibling = relative.nextElementSibling

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.UPDATE,
                    operands: {
                        element: element,
                        previousSibling: previousSibling,
                        previousParent: previousParent,
                        parent: parent,
                        sibling: sibling,
                    }
                }
                this.historyService.push(state)


                break;
            }
            case PLACEMENT_MODE.INSIDE: {
                const previousSibling = element.nextElementSibling
                const previousParent = element.parentElement
                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.UPDATE,
                    operands: {
                        element: element,
                        previousSibling: previousSibling,
                        previousParent: previousParent,
                        parent: relative,
                        sibling: undefined,
                    }
                }
                this.historyService.push(state)


                break

            }
            case PLACEMENT_MODE.INSIDE_BEFORE: {

                const previousSibling = element.nextElementSibling
                const previousParent = element.parentElement
                const sibling = relative.firstElementChild

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.UPDATE,
                    operands: {
                        element: element,
                        previousSibling: previousSibling,
                        previousParent: previousParent,
                        parent: undefined,
                        sibling: sibling,
                    }
                }
                this.historyService.push(state)

            }


                break;


            case PLACEMENT_MODE.INSIDE_AFTER: {
                const previousSibling = element.nextElementSibling
                const previousParent = element.parentElement
                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.UPDATE,
                    operands: {
                        element: element,
                        previousSibling: previousSibling,
                        previousParent: previousParent,
                        parent: relative,
                        sibling: undefined,
                    }
                }
                this.historyService.push(state)



                break;
            }
        }
    }

    saveDomDeleteToHistory(element: HTMLElement) {
        const previousSibling = element.nextElementSibling
        const previousParent = element.parentElement
        const state: State = {
            operationType: OPERTATION_TYPE.DOM,
            operationMode: OPERTATION_MODE.DELETE,
            operands: {
                element: element,
                previousSibling: previousSibling,
                previousParent: previousParent,
                parent: undefined,
                sibling: undefined,
            }
        }
        this.historyService.push(state)
    }

    saveDomCreateToHistory(relative: HTMLElement, element: HTMLElement, mode: PLACEMENT_MODE) {
        switch (mode) {
            case PLACEMENT_MODE.BEFORE: {

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.CREATE,
                    operands: {
                        element: element,
                        previousSibling: undefined,
                        previousParent: undefined,
                        parent: undefined,
                        sibling: relative,
                    }
                }
                this.historyService.push(state)

            }

                break;


            case PLACEMENT_MODE.AFTER: {
                const parent = relative.parentElement
                const sibling = relative.nextElementSibling

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.CREATE,
                    operands: {
                        element: element,
                        previousSibling: undefined,
                        previousParent: undefined,
                        parent: parent,
                        sibling: sibling,
                    }
                }
                this.historyService.push(state)


                break;
            }
            case PLACEMENT_MODE.INSIDE: {

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.CREATE,
                    operands: {
                        element: element,
                        previousSibling: undefined,
                        previousParent: undefined,
                        parent: relative,
                        sibling: undefined,
                    }
                }
                this.historyService.push(state)


                break

            }
            case PLACEMENT_MODE.INSIDE_BEFORE: {

                const sibling = relative.firstElementChild

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.CREATE,
                    operands: {
                        element: element,
                        previousSibling: undefined,
                        previousParent: undefined,
                        parent: undefined,
                        sibling: sibling,
                    }
                }
                this.historyService.push(state)

            }


                break;


            case PLACEMENT_MODE.INSIDE_AFTER: {

                const state: State = {
                    operationType: OPERTATION_TYPE.DOM,
                    operationMode: OPERTATION_MODE.CREATE,
                    operands: {
                        element: element,
                        previousSibling: undefined,
                        previousParent: undefined,
                        parent: relative,
                        sibling: undefined,
                    }
                }
                this.historyService.push(state)



                break;
            }
        }
    }

    setLock(elt: HTMLElement) {
        if (!elt.hasAttribute("odin-locked"))
            elt.setAttribute("odin-locked", "false")
    }
    checkLocked(elt: HTMLElement): boolean {
        if (elt.hasAttribute('odin-locked'))
            if (elt.getAttribute('odin-locked') == 'true')
                return true;
            else
                return false
        else
            return false
    }

    toggleLock(elt: HTMLElement, single: boolean, setTrue?: boolean) {

        //toggle locked single
        if (single && setTrue == undefined) {
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") == "true")
                elt.setAttribute("odin-locked", "false")
            else
                elt.setAttribute("odin-locked", "true")


        } //toggle locked children
        else if (!single && setTrue == undefined) {
            elt.querySelectorAll("*").forEach((elt) => {
                this.setLock(elt as HTMLElement)
                if (elt.getAttribute("odin-locked") == "true")
                    elt.setAttribute("odin-locked", "false")
                else
                    elt.setAttribute("odin-locked", "true")

            })
            //element itself
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") == "true")
                elt.setAttribute("odin-locked", "false")
            else
                elt.setAttribute("odin-locked", "true")


        }
        //turn on locked for one element
        else if (single && setTrue) {
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") !== "true") {
                elt.setAttribute("odin-locked", "true")
            }

        }
        //turn off locked for one element
        else if (single && !setTrue) {
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") == "true") {
                elt.setAttribute("odin-locked", "false")
            }

            //turn on locked for element and children
        } else if (!single && setTrue) {
            elt.querySelectorAll("*").forEach((elt) => {
                this.setLock(elt as HTMLElement)
                if (elt.getAttribute("odin-locked") !== "true") {
                    elt.setAttribute("odin-locked", "true")
                }
            })
            //element itself
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") !== "true") {
                elt.setAttribute("odin-locked", "true")
            }
            //turn off locked for element and children    
        } else if (!single && !setTrue) {

            elt.querySelectorAll("*").forEach((elt) => {
                this.setLock(elt as HTMLElement)
                if (elt.getAttribute("odin-locked") == "true") {
                    elt.setAttribute("odin-locked", "false")
                }
            })
            //element itself
            this.setLock(elt)
            if (elt.getAttribute("odin-locked") == "true") {
                elt.setAttribute("odin-locked", "false")
            }
        }
    }
    toggleDropZone(elt: HTMLElement, single: boolean, setTrue?: boolean) {

        //toggle dropzone
        if (single && setTrue == undefined) {

            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") == "true")
                    elt.setAttribute("dropzone", "toggled-false")
                else if (elt.getAttribute("dropzone") == "toggled-false")
                    elt.setAttribute("dropzone", "true")
            }
        } else if (!single && setTrue == undefined) {
            elt.querySelectorAll("*").forEach((e) => {
                if (e.hasAttribute("dropzone")) {
                    if (e.getAttribute("dropzone") == "true")
                        e.setAttribute("dropzone", "toggled-false")
                    else if (e.getAttribute("dropzone") == "toggled-false")
                        e.setAttribute("dropzone", "true")
                }
            })

            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") == "true")
                    elt.setAttribute("dropzone", "toggled-false")
                else if (elt.getAttribute("dropzone") == "toggled-false")
                    elt.setAttribute("dropzone", "true")
            }
        }
        //turn on dropzone for one element
        else if (single && setTrue) {
            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") !== "true") {
                    elt.setAttribute("dropzone", "true")
                }
            }
        }
        //turn off dropzone for one element
        else if (single && !setTrue) {
            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") == "true") {
                    elt.setAttribute("dropzone", "false")
                }
            }
            //turn on dropzone for element and children
        } else if (!single && setTrue) {
            elt.querySelectorAll("*").forEach((elt) => {
                if (elt.hasAttribute("dropzone")) {
                    if (elt.getAttribute("dropzone") !== "true") {
                        elt.setAttribute("dropzone", "true")
                    }
                }
            })

            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") !== "true") {
                    elt.setAttribute("dropzone", "true")
                }
            }
            //turn off dropzone for element and children    
        } else if (!single && !setTrue) {

            elt.querySelectorAll("*").forEach((elt) => {
                if (elt.hasAttribute("dropzone")) {
                    if (elt.getAttribute("dropzone") == "true") {
                        elt.setAttribute("dropzone", "false")
                    }
                }
            })

            if (elt.hasAttribute("dropzone")) {
                if (elt.getAttribute("dropzone") == "true") {
                    elt.setAttribute("dropzone", "false")
                }
            }
        }
    }

    toggleDraggable(elt: HTMLElement, single: boolean) {

        if (single) {
            if (elt.hasAttribute("draggable")) {
                if (elt.getAttribute("draggable") == "true")
                    elt.setAttribute("draggable", "toggled-false")
                else if (elt.getAttribute("draggable") == "toggled-false")
                    elt.setAttribute("draggable", "true")
            }
        } else {
            elt.querySelectorAll("*").forEach((e) => {
                if (e.hasAttribute("draggable")) {
                    if (e.getAttribute("draggable") == "true")
                        e.setAttribute("draggable", "toggled-false")
                    else if (e.getAttribute("draggable") == "toggled-false")
                        e.setAttribute("draggable", "true")
                }
            })

            if (elt.hasAttribute("draggable")) {
                if (elt.getAttribute("draggable") == "true")
                    elt.setAttribute("draggable", "toggled-false")
                else if (elt.getAttribute("draggable") == "toggled-false")
                    elt.setAttribute("draggable", "true")
            }
        }
    }

    toggleAll(elt: HTMLElement) {
        elt.querySelectorAll("*").forEach((e) => {
            if (!this.validateElement(e as HTMLElement)) {
                e.setAttribute("dropzone", "true")
                e.setAttribute("draggable", "true")
            }
        })

    }

    static init(window: HTMLIFrameElement) {
        instance = new Workspace(window);
    }

    static getInstance(): Workspace {
        if (instance != undefined) {
            return instance
        }
        else
            throw Error('Workspace not instantiated');
    }

    /**
     * Workspace on drag over uitility funcitions
     * 
     *  */
    compareNodes(nodes1: Array<Node>, nodes2: Array<Node>): boolean {
        if (nodes1.length !== nodes2.length)
            return false
        for (let i = 0; i < nodes2.length; i++) {
            if (nodes1[i].nodeValue !== nodes2[i].nodeValue)
                return false
        }
        return true
    }
    private getTextNodesIn(node: Node, includeWhitespaceNodes: boolean, clone: boolean) {
        const textNodes = new Array<Node>()
        const whitespace = /^\s*$/;
        const getTextNodes = (node: Node) => {
            if (node.nodeType == 3) {
                if (includeWhitespaceNodes || !whitespace.test(node.nodeValue!)) {
                    if (clone)
                        textNodes.push(node.cloneNode());
                    else
                        textNodes.push(node);

                }
            } else {
                for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                    getTextNodes(node.childNodes[i]);
                }
            }
        }
        getTextNodes(node);
        return textNodes;
    }
    private removeTextNodesIn(input: Node, includeWhitespaceNodes: boolean) {
        const whitespace = /^\s*$/;
        let parent = input
        const getTextNodes = (node: Node) => {
            if (node) {
                if (node.nodeType == 3) {
                    if (includeWhitespaceNodes || !whitespace.test(node.nodeValue!)) {
                        parent.removeChild(node)
                    }
                } else {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        parent = node
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }
        }
        getTextNodes(input);
    }

    private calculateDistance(x: number, y: number, mouseX: number, mouseY: number): number {
        return Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2));
    }

    private getPixelRatio() {
        return this.dz.device() / this.dz.zoom();
    }

    private validateElement(elt: HTMLElement): boolean {
        const voidelements = ['i', 'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'video', 'iframe', 'source', 'track', 'wbr'];
        return voidelements.includes(elt.tagName.toLocaleLowerCase());
    }

    private findValidParent(elt: HTMLElement, direction: GUIDE_DIRECTION): HTMLElement {
        switch (direction) {
            case GUIDE_DIRECTION.TOP: {
                return elt
            }

            case GUIDE_DIRECTION.RIGHT: {
                const parent = elt.parentElement;
                const rect = elt.getBoundingClientRect();
                const rectParent = parent?.getBoundingClientRect();

                if (["body", "html"].includes(elt!.tagName.toLowerCase()))
                    return elt
                else if (Math.abs(rectParent!.right - rect.right) == 0)
                    return parent!
                else
                    return elt
            }

            case GUIDE_DIRECTION.BOTTOM: {
                return elt
            }

            case GUIDE_DIRECTION.LEFT: {
                const parent = elt.parentElement;
                const rect = elt.getBoundingClientRect();
                const rectParent = parent?.getBoundingClientRect();

                if (["body", "html"].includes(elt!.tagName.toLowerCase()))
                    return elt
                else if (Math.abs(rectParent!.left - rect.left) == 0)
                    return parent!
                else
                    return elt
            }

        }
    }

    private getMousePercents(e: MouseEvent, rect: DOMRect) {

        const posPercentX = ((e.x - rect.left) / (rect.right - rect.left)) * 100;
        const posPercentY = ((e.y - rect.top) / (rect.bottom - rect.top)) * 100;

        return { x: posPercentX, y: posPercentY }
    }

    private getDisplayType(element: HTMLElement): string {
        var cStyle = this.root.contentWindow!.getComputedStyle(element, "");
        if (cStyle.display == "flex" && cStyle.flexDirection == "vertical")
            return "inline"
        return cStyle.display;
    }

    private findClosestElement(elt: HTMLElement, clientX: number, clientY: number): HTMLElement {
        const children = Array.from(elt.children);
        var closestElt: HTMLElement | undefined = undefined;
        var closetDistance: number = 0
        children.forEach((child) => {

            var rect = child.getBoundingClientRect();
            var distance = 0;
            var distance1, distance2 = null;
            var x0 = rect.left;
            var x2 = rect.right;
            var y1 = rect.top;
            var y2 = rect.bottom;
            var corner1 = null;
            var corner2 = null;

            if (clientY > y1 && clientY < y2) {
                if (clientX < x0 && clientY < x2) {
                    corner1 = { x: x0, y: clientY };
                }
                else {
                    corner1 = { x: x2, y: clientY, };
                }
            }

            else if (clientX > x0 && clientX < x2) {
                if (clientY < y1 && clientY < y2) {
                    corner1 = { x: clientX, y: y1, };
                }
                else {
                    corner1 = { x: clientX, y: y2, };
                }
            }
            else {

                if (clientX < x0 && clientX < x2) {
                    corner1 = { x: x0, y: y1, };
                    corner2 = { x: x0, y: y2, };
                }
                else if (clientX > x0 && clientX > x2) {

                    corner1 = { x: x2, y: y1, };
                    corner2 = { x: x2, y: y2, };
                }
                else if (clientY < y1 && clientY < y2) {

                    corner1 = { x: x0, y: y1, };
                    corner2 = { x: x2, y: y1, };
                }
                else if (clientY > y1 && clientY > y2) {

                    corner1 = { x: x0, y: y2, };
                    corner2 = { x: x2, y: y2, }
                }
            }

            distance1 = this.calculateDistance(corner1!.x, corner1!.y, clientX, clientY);
            if (corner2 !== null)
                distance2 = this.calculateDistance(corner2.x, corner2.y, clientX, clientY);

            if (distance1 < distance2! || distance2 === null) {
                distance = distance1;
            }
            else {
                distance = distance2;
            }
            if (closestElt != undefined) {
                if (closetDistance < distance) {
                    return true;
                }
            }
            closestElt = child as HTMLElement
            closetDistance = distance
        })

        return closestElt!;

    }

}
