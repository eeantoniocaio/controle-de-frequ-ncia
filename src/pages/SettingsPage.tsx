import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Upload, Plus, Trash2, ChevronDown, ChevronRight, UserX } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { classes, students, addClass, addStudentsFromCSV, deleteClass, deleteStudent, deleteStudents } = useAppContext();
    const [newClassName, setNewClassName] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

    // State for selected students for bulk deletion (Set of IDs)
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (newClassName.trim()) {
            addClass(newClassName.trim());
            setNewClassName('');
            setMessage({ type: 'success', text: 'Turma criada com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteClass = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir a turma "${name}"? Todos os alunos e registros de presença serão perdidos.`)) {
            deleteClass(id);
            if (selectedClassId === id) setSelectedClassId('');
            setMessage({ type: 'success', text: `Turma ${name} excluída.` });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteStudent = (id: string, name: string) => {
        if (window.confirm(`Remover aluno "${name}"?`)) {
            deleteStudent(id);
        }
    };

    const toggleExpandClass = (id: string) => {
        if (expandedClassId === id) {
            setExpandedClassId(null);
            setSelectedStudentIds(new Set()); // Clear selection when collapsing
        } else {
            setExpandedClassId(id);
            setSelectedStudentIds(new Set()); // Start fresh when opening a new class
        }
    };

    const handleToggleSelectStudent = (id: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedStudentIds(newSelected);
    };

    const handleSelectAll = (clsId: string) => {
        const classStudents = students.filter(s => s.classId === clsId);
        if (selectedStudentIds.size === classStudents.length) {
            // Deselect all
            setSelectedStudentIds(new Set());
        } else {
            // Select all
            setSelectedStudentIds(new Set(classStudents.map(s => s.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedStudentIds.size === 0) return;

        if (window.confirm(`Tem certeza que deseja excluir ${selectedStudentIds.size} alunos selecionados?`)) {
            deleteStudents(Array.from(selectedStudentIds));
            setSelectedStudentIds(new Set());
            setMessage({ type: 'success', text: 'Alunos excluídos.' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedClassId) {
            setMessage({ type: 'error', text: 'Por favor, selecione uma turma primeiro.' });
            return;
        }
        if (!csvFile) {
            setMessage({ type: 'error', text: 'Por favor, selecione um arquivo CSV.' });
            return;
        }

        try {
            const text = await csvFile.text();
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

            if (lines.length === 0) {
                setMessage({ type: 'error', text: 'O arquivo CSV parece estar vazio.' });
                return;
            }

            // Keyword to search for in header row
            let headerIndex = -1;
            let separator = ',';
            let nameColIndex = -1;

            // 1. Scan lines to find the header row (check first 20 lines)
            for (let i = 0; i < Math.min(lines.length, 20); i++) {
                const line = lines[i].toLowerCase();
                const possibleSeparators = [';', ',', '\t'];

                for (const sep of possibleSeparators) {
                    const cols = line.split(sep).map(c => c.trim());
                    const index = cols.findIndex(c =>
                        c === 'nome do aluno' ||
                        c === 'nome' ||
                        c === 'student name' ||
                        c.includes('nome do aluno')
                    );

                    if (index !== -1) {
                        headerIndex = i;
                        separator = sep;
                        nameColIndex = index;
                        break;
                    }
                }
                if (headerIndex !== -1) break;
            }

            let startRow = 0;
            if (headerIndex !== -1) {
                startRow = headerIndex + 1;
            } else {
                nameColIndex = 0;
                startRow = 0;
            }

            const namesToImport: string[] = [];

            for (let i = startRow; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                const columns = line.split(separator).map(c => c.trim());

                if (columns.length > nameColIndex) {
                    let name = columns[nameColIndex].replace(/^["']|["']$/g, '');
                    if (name && name.length > 2 && isNaN(Number(name))) {
                        namesToImport.push(name);
                    }
                }
            }

            if (namesToImport.length === 0) {
                setMessage({ type: 'error', text: `Nenhum nome válido encontrado. Verifique se a coluna "Nome do Aluno" existe.` });
                return;
            }

            addStudentsFromCSV(selectedClassId, namesToImport);

            setCsvFile(null);
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            setMessage({ type: 'success', text: `${namesToImport.length} alunos importados com sucesso!` });
            setTimeout(() => setMessage(null), 3000);

        } catch (error) {
            console.error('CSV Import Error:', error);
            setMessage({ type: 'error', text: 'Falha ao processar o arquivo CSV.' });
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            <header className="page-header">
                <h2 className="page-title">Configurações</h2>
            </header>

            {message && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Plus size={20} /> Criar Nova Turma
                </h3>
                <form onSubmit={handleAddClass}>
                    <div className="input-group">
                        <label className="label">Nome da Turma</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ex: 3º Ano A"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar Turma</button>
                </form>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Upload size={20} /> Importar Alunos
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                    Faça upload de um arquivo CSV. O app identificará automaticamente a coluna "Nome do Aluno".
                </p>
                <form onSubmit={handleFileUpload}>
                    <div className="input-group">
                        <label className="label">Selecione a Turma</label>
                        <select
                            className="input"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">-- Selecione uma Turma --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="label">Arquivo CSV</label>
                        <input
                            type="file"
                            accept=".csv"
                            className="input"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Importar Alunos
                    </button>
                </form>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Gerenciar Turmas</h3>
                {classes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma turma definida.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {classes.map(cls => (
                            <div key={cls.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#f8fafc',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div
                                        onClick={() => toggleExpandClass(cls.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer', flex: 1 }}
                                    >
                                        {expandedClassId === cls.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        <span style={{ fontWeight: 500 }}>{cls.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            ({students.filter(s => s.classId === cls.id).length} alunos)
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClass(e, cls.id, cls.name)}
                                        className="btn-icon"
                                        style={{ color: 'var(--danger)' }}
                                        title="Excluir Turma"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {expandedClassId === cls.id && (
                                    <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                                        {students.filter(s => s.classId === cls.id).length === 0 ? (
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nenhum aluno nesta turma.</p>
                                        ) : (
                                            <>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 'var(--spacing-sm)',
                                                    paddingBottom: 'var(--spacing-sm)',
                                                    borderBottom: '1px solid var(--border-color)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudentIds.size === students.filter(s => s.classId === cls.id).length && students.filter(s => s.classId === cls.id).length > 0}
                                                            onChange={() => handleSelectAll(cls.id)}
                                                            style={{ width: '18px', height: '18px' }}
                                                        />
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Selecionar Todos</span>
                                                    </div>
                                                    {selectedStudentIds.size > 0 && (
                                                        <button
                                                            onClick={handleBulkDelete}
                                                            style={{
                                                                color: 'var(--danger)',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 600,
                                                                background: '#fee2e2',
                                                                padding: '4px 12px',
                                                                borderRadius: 'var(--radius-full)',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Excluir Selecionados ({selectedStudentIds.size})
                                                        </button>
                                                    )}
                                                </div>
                                                <ul style={{ listStyle: 'none' }}>
                                                    {students.filter(s => s.classId === cls.id).map(student => (
                                                        <li key={student.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: 'var(--spacing-xs) 0',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedStudentIds.has(student.id)}
                                                                    onChange={() => handleToggleSelectStudent(student.id)}
                                                                    style={{ width: '16px', height: '16px' }}
                                                                />
                                                                <span>{student.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteStudent(student.id, student.name)}
                                                                style={{ color: 'var(--danger)', background: 'none', padding: '4px' }}
                                                                title="Remover Aluno"
                                                            >
                                                                <UserX size={16} />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <p><strong>Nota:</strong> Arquivos com cabeçalho "Nome" ou "Nome do Aluno" são detectados automaticamente.</p>
            </div>

        </div>
    );
};

export default SettingsPage;
