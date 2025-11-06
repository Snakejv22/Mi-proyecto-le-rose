import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './App.css';

const createNode = (content = '') => ({
  id: `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  content,
  collapsed: false,
  children: [],
});

const cloneTree = (nodes = []) => nodes.map((node) => ({
  ...node,
  children: cloneTree(node.children || []),
}));

const findNodePath = (nodes, nodeId, path = []) => {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const newPath = [...path, i];
    if (node.id === nodeId) {
      return newPath;
    }
    const childPath = findNodePath(node.children, nodeId, newPath);
    if (childPath) {
      return childPath;
    }
  }
  return null;
};

const getNodeAtPath = (nodes, path) => {
  let current = null;
  let currentChildren = nodes;
  for (let i = 0; i < path.length; i += 1) {
    current = currentChildren[path[i]];
    if (!current) {
      return null;
    }
    currentChildren = current.children;
  }
  return current;
};

const updateNodeContent = (nodes, nodeId, newContent) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const node = getNodeAtPath(treeCopy, path);
  if (!node) {
    return { tree: nodes, success: false };
  }
  node.content = newContent;
  return { tree: treeCopy, success: true };
};

const toggleNodeCollapse = (nodes, nodeId) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const node = getNodeAtPath(treeCopy, path);
  if (!node) {
    return { tree: nodes, success: false };
  }
  node.collapsed = !node.collapsed;
  return { tree: treeCopy, success: true };
};

const insertSibling = (nodes, nodeId, newNode) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parentChildren = parentPath.length === 0
    ? treeCopy
    : getNodeAtPath(treeCopy, parentPath).children;

  if (!parentChildren) {
    return { tree: nodes, success: false };
  }

  parentChildren.splice(index + 1, 0, newNode);
  return { tree: treeCopy, success: true };
};

const insertChild = (nodes, nodeId, newNode) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const node = getNodeAtPath(treeCopy, path);
  if (!node) {
    return { tree: nodes, success: false };
  }
  node.children = [...(node.children || []), newNode];
  node.collapsed = false;
  return { tree: treeCopy, success: true };
};

const removeNode = (nodes, nodeId) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parentChildren = parentPath.length === 0
    ? treeCopy
    : getNodeAtPath(treeCopy, parentPath).children;

  if (!parentChildren) {
    return { tree: nodes, success: false };
  }

  parentChildren.splice(index, 1);
  return { tree: treeCopy, success: true };
};

const indentNode = (nodes, nodeId) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path) {
    return { tree: nodes, success: false };
  }
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  if (index === 0) {
    return { tree: nodes, success: false };
  }
  const parentChildren = parentPath.length === 0
    ? treeCopy
    : getNodeAtPath(treeCopy, parentPath).children;

  if (!parentChildren) {
    return { tree: nodes, success: false };
  }

  const [nodeToMove] = parentChildren.splice(index, 1);
  const previousSibling = parentChildren[index - 1];
  previousSibling.children = [...(previousSibling.children || []), nodeToMove];
  previousSibling.collapsed = false;
  return { tree: treeCopy, success: true };
};

const outdentNode = (nodes, nodeId) => {
  const treeCopy = cloneTree(nodes);
  const path = findNodePath(treeCopy, nodeId);
  if (!path || path.length === 0) {
    return { tree: nodes, success: false };
  }
  const parentPath = path.slice(0, -1);
  if (parentPath.length === 0) {
    return { tree: nodes, success: false };
  }
  const grandParentPath = parentPath.slice(0, -1);
  const parentIndex = parentPath[parentPath.length - 1];
  const index = path[path.length - 1];

  const parentNode = getNodeAtPath(treeCopy, parentPath);
  if (!parentNode || !parentNode.children) {
    return { tree: nodes, success: false };
  }
  const nodeToMove = parentNode.children.splice(index, 1)[0];

  const grandParentChildren = grandParentPath.length === 0
    ? treeCopy
    : getNodeAtPath(treeCopy, grandParentPath).children;

  if (!grandParentChildren) {
    return { tree: nodes, success: false };
  }

  grandParentChildren.splice(parentIndex + 1, 0, nodeToMove);
  return { tree: treeCopy, success: true };
};

const initialTree = [
  {
    id: 'node-vision',
    content: 'Visión de la app',
    collapsed: false,
    children: [
      {
        id: 'node-proposito',
        content: 'Crear un espacio minimalista para organizar ideas',
        collapsed: false,
        children: [],
      },
      {
        id: 'node-personas',
        content: 'Pensado para equipos pequeños y creadores individuales',
        collapsed: false,
        children: [],
      },
    ],
  },
  {
    id: 'node-sprint',
    content: 'Sprint de lanzamiento',
    collapsed: false,
    children: [
      {
        id: 'node-diseno',
        content: 'Definir interfaz base',
        collapsed: false,
        children: [
          {
            id: 'node-paleta',
            content: 'Explorar paletas suaves y tipografía legible',
            collapsed: false,
            children: [],
          },
        ],
      },
      {
        id: 'node-tecnologia',
        content: 'Seleccionar stack frontend',
        collapsed: false,
        children: [],
      },
    ],
  },
];

const OutlineItem = ({
  node,
  level,
  selectedId,
  onSelect,
  onUpdate,
  onAddSibling,
  onAddChild,
  onDelete,
  onIndent,
  onOutdent,
  onToggle,
  searchTerm,
}) => {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    onUpdate(node.id, event.target.value);
  };

  const handleFocus = () => {
    onSelect(node.id);
  };

  useEffect(() => {
    if (selectedId === node.id && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [node.id, selectedId]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onAddSibling(node.id);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        onOutdent(node.id);
      } else {
        onIndent(node.id);
      }
    }
    if (event.key === 'Backspace' && node.content.trim() === '' && node.children.length === 0) {
      event.preventDefault();
      onDelete(node.id);
    }
    if (event.key === 'ArrowRight' && node.collapsed) {
      event.preventDefault();
      onToggle(node.id);
    }
    if (event.key === 'ArrowLeft' && !node.collapsed && node.children.length > 0) {
      event.preventDefault();
      onToggle(node.id);
    }
  };

  const isSelected = selectedId === node.id;
  const matchesQuery = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return false;
    }
    return node.content.toLowerCase().includes(term);
  }, [node.content, searchTerm]);

  return (
    <li className="outline-item" data-level={level}>
      <div
        className={`outline-row ${isSelected ? 'outline-row--selected' : ''} ${
          matchesQuery ? 'outline-row--matched' : ''
        }`}
        onClick={() => onSelect(node.id)}
        role="presentation"
      >
        <button
          type="button"
          className="outline-toggle"
          onClick={() => onToggle(node.id)}
          aria-label={node.collapsed ? 'Expandir elemento' : 'Contraer elemento'}
        >
          {node.children.length > 0 ? (node.collapsed ? '+' : '−') : '•'}
        </button>
        <div className="outline-content">
          <input
            type="text"
            value={node.content}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder="Escribe una idea..."
            className="outline-input"
            aria-label="Descripción del elemento"
          />
        </div>
        <div className="outline-actions">
          <button type="button" onClick={() => onAddChild(node.id)} aria-label="Añadir subelemento">
            ↳
          </button>
          <button type="button" onClick={() => onAddSibling(node.id)} aria-label="Añadir elemento al mismo nivel">
            ＋
          </button>
          <button type="button" onClick={() => onIndent(node.id)} aria-label="Indentar">
            ↦
          </button>
          <button type="button" onClick={() => onOutdent(node.id)} aria-label="Desindentar">
            ↤
          </button>
          <button type="button" onClick={() => onDelete(node.id)} aria-label="Eliminar elemento">
            ✕
          </button>
        </div>
      </div>
      {!node.collapsed && node.children.length > 0 && (
        <ul className="outline-children">
          {node.children.map((child) => (
            <OutlineItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onAddSibling={onAddSibling}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

function App() {
  const [tree, setTree] = useState(initialTree);
  const [selectedId, setSelectedId] = useState(initialTree[0]?.id ?? null);
  const [searchTerm, setSearchTerm] = useState('');

  const totalNodes = useMemo(() => {
    const countNodes = (nodes) => nodes.reduce((acc, node) => acc + 1 + countNodes(node.children), 0);
    return countNodes(tree);
  }, [tree]);

  const handleUpdateContent = (nodeId, content) => {
    setTree((prev) => {
      const { tree: nextTree } = updateNodeContent(prev, nodeId, content);
      return nextTree;
    });
  };

  const handleToggle = (nodeId) => {
    setTree((prev) => {
      const { tree: nextTree } = toggleNodeCollapse(prev, nodeId);
      return nextTree;
    });
  };

  const handleAddSibling = (nodeId) => {
    const newNode = createNode('Nueva idea');
    setTree((prev) => {
      const { tree: nextTree, success } = insertSibling(prev, nodeId, newNode);
      if (success) {
        setSelectedId(newNode.id);
        return nextTree;
      }
      return prev;
    });
  };

  const handleAddChild = (nodeId) => {
    const newNode = createNode('Nuevo detalle');
    setTree((prev) => {
      const { tree: nextTree, success } = insertChild(prev, nodeId, newNode);
      if (success) {
        setSelectedId(newNode.id);
        return nextTree;
      }
      return prev;
    });
  };

  const handleDelete = (nodeId) => {
    setTree((prev) => {
      if (prev.length === 1 && prev[0].id === nodeId) {
        return prev;
      }
      const { tree: nextTree, success } = removeNode(prev, nodeId);
      if (!success) {
        return prev;
      }
      if (selectedId === nodeId) {
        setSelectedId(null);
      }
      return nextTree.length === 0 ? [createNode('Nueva idea')] : nextTree;
    });
  };

  const handleIndent = (nodeId) => {
    setTree((prev) => {
      const { tree: nextTree, success } = indentNode(prev, nodeId);
      return success ? nextTree : prev;
    });
  };

  const handleOutdent = (nodeId) => {
    setTree((prev) => {
      const { tree: nextTree, success } = outdentNode(prev, nodeId);
      return success ? nextTree : prev;
    });
  };

  const handleAddRoot = () => {
    const newNode = createNode('Nueva idea');
    setTree((prev) => {
      const copy = cloneTree(prev);
      copy.push(newNode);
      setSelectedId(newNode.id);
      return copy;
    });
  };

  const handleClear = () => {
    const freshNode = createNode('Idea principal');
    setTree([freshNode]);
    setSelectedId(freshNode.id);
    setSearchTerm('');
  };

  return (
    <div className="app">
      <aside className="app-sidebar">
        <h1 className="app-title">Mi Mapa Mental</h1>
        <p className="app-subtitle">
          Organiza tus pensamientos de forma jerárquica con una experiencia similar a Workflowy.
        </p>
        <div className="app-stats">
          <span>
            Total de elementos
            <strong>{totalNodes}</strong>
          </span>
        </div>
        <div className="sidebar-actions">
          <button type="button" onClick={handleAddRoot} className="primary-action">
            Añadir elemento raíz
          </button>
          <button type="button" onClick={handleClear} className="ghost-action">
            Reiniciar tablero
          </button>
        </div>
        <div className="sidebar-hint">
          <h2>Atajos</h2>
          <ul>
            <li><kbd>Enter</kbd> para crear un elemento al mismo nivel</li>
            <li><kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> para (des)indentar</li>
            <li><kbd>Backspace</kbd> sobre un elemento vacío para eliminarlo</li>
            <li><kbd>←</kbd> / <kbd>→</kbd> para contraer o expandir</li>
          </ul>
        </div>
      </aside>
      <main className="app-main">
        <div className="outline-header">
          <div className="search-box">
            <label htmlFor="outline-search">Buscar</label>
            <input
              id="outline-search"
              type="search"
              placeholder="Filtra tus ideas..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <ul className="outline-root">
          {tree.map((node) => (
            <OutlineItem
              key={node.id}
              node={node}
              level={0}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={handleUpdateContent}
              onAddSibling={handleAddSibling}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
              onIndent={handleIndent}
              onOutdent={handleOutdent}
              onToggle={handleToggle}
              searchTerm={searchTerm}
            />
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
