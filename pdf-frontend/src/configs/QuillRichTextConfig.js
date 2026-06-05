import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Quill's formula module requires KaTeX on the global scope
window.katex = katex;

function undoChange() {
    this.quill.history.undo();
}

function redoChange() {
    this.quill.history.redo();
}

export function setupQuillIcons() {
    var icons = Quill.import("ui/icons");
    icons["undo"] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon>
    <path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path>
  </svg>`;
    icons["redo"] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon>
    <path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path>
  </svg>`;
}

export const quillModules = {
    history: {
        delay: 200,
        maxStack: 500,
        userOnly: true
    },
    toolbar: {
        container: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }, { size: [] }],
            [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
            [{ script: "sub" }, { script: "super" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }, { align: [] }],
            [{ color: [] }, { background: [] }],
            ["link", "video", "formula"],
            ["undo", "redo"],
            ["clean"]
        ],
        handlers: {
            undo: undoChange,
            redo: redoChange
        }
    },
};

export const quillOptions = {
    modules: quillModules,
    placeholder: 'Please Input',
    theme: 'snow',
};