import React, { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import type { Class, Student } from '../types';

interface ClassManagerProps {
    classes: Class[];
    students: Student[];
    onAddClass: (name: string) => Promise<void>;
    onUpdateClass: (id: string, newName: string) => Promise<void>;
    onDeleteClass: (id: string, name: string) => void;
    onDeleteStudent: (id: string, name: string) => void;
    onDeleteStudents: (ids: string[]) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({
    classes,
    students,
    onAddClass,
    onUpdateClass,
    onDeleteClass,
    onDeleteStudent,
    onDeleteStudents
}) => {
    const [newClassName, setNewClassName] = useState('');
    const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newClassName.trim()) {
            await onAddClass(newClassName.trim());
            setNewClassName('');
        }
    };

    const toggleExpandClass = (id: string) => {
        if (expandedClassId === id) {
            setExpandedClassId(null);
            setSelectedStudentIds(new Set());
        } else {
            setExpandedClassId(id);
            setSelectedStudentIds(new Set());
        }
    };

    const handleSelectAll = (clsId: string) => {
        const classStudents = students.filter(s => s.classId === clsId);
        const classStudentIds = classStudents.map(s => s.id);
        const allSelected = classStudentIds.length > 0 && classStudentIds.every(id => selectedStudentIds.has(id));

        const newSelected = new Set(selectedStudentIds);
        if (allSelected) {
            classStudentIds.forEach(id => newSelected.delete(id));
        } else {
            classStudentIds.forEach(id => newSelected.add(id));
        }
        setSelectedStudentIds(newSelected);
    };

    const handleToggleSelectStudent = (id: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedStudentIds(newSelected);
    };

    return (
        <div className="flex-col gap-md">
            <div className="card">
                <h3 className="mb-md flex items-center gap-xs">
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
                    <button type="submit" className="btn btn-primary w-full">Criar Turma</button>
                </form>
            </div>

            <div className="card">
                <h3 className="mb-md">Gerenciar Turmas</h3>
                {classes.length === 0 ? (
                    <p className="text-secondary">Nenhuma turma definida.</p>
                ) : (
                    <div className="flex-col gap-sm">
                        {classes.map(cls => (
                            <div key={cls.id} className="border rounded-md overflow-hidden" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <div className="p-md flex justify-between items-center" style={{ padding: 'var(--spacing-md)', background: '#f8fafc' }}>
                                    {editingClassId === cls.id ? (
                                        <div className="flex items-center gap-sm flex-1" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                className="input"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                style={{ padding: '6px 12px', height: 'auto' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onUpdateClass(cls.id, editName);
                                                        setEditingClassId(null);
                                                    }
                                                    if (e.key === 'Escape') setEditingClassId(null);
                                                }}
                                            />
                                            <div className="flex gap-xs">
                                                <button onClick={() => { onUpdateClass(cls.id, editName); setEditingClassId(null); }} className="btn btn-primary text-sm">Salvar</button>
                                                <button onClick={() => setEditingClassId(null)} className="btn text-sm" style={{ background: '#ddd' }}>Canc.</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div onClick={() => toggleExpandClass(cls.id)} className="flex items-center gap-sm cursor-pointer flex-1">
                                                {expandedClassId === cls.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                <span className="font-semibold">{cls.name}</span>
                                                <span className="text-sm text-secondary">
                                                    ({students.filter(s => s.classId === cls.id).length} alunos)
                                                </span>
                                            </div>
                                            <div className="flex gap-xs">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingClassId(cls.id); setEditName(cls.name); }} className="btn-icon text-secondary"><Pencil size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteClass(cls.id, cls.name); }} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={20} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {expandedClassId === cls.id && (
                                    <div className="p-md bg-white" style={{ padding: 'var(--spacing-md)' }}>
                                        <div className="flex justify-between items-center mb-md pb-sm border-b" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <div onClick={() => handleSelectAll(cls.id)} className="flex items-center gap-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={students.filter(s => s.classId === cls.id).length > 0 && students.filter(s => s.classId === cls.id).every(s => selectedStudentIds.has(s.id))}
                                                    onChange={() => handleSelectAll(cls.id)}
                                                />
                                                <span className="font-semibold">Selecionar Todos</span>
                                            </div>
                                            {selectedStudentIds.size > 0 && (
                                                <button onClick={() => { onDeleteStudents(Array.from(selectedStudentIds)); setSelectedStudentIds(new Set()); }} className="btn" style={{ background: '#fee2e2', color: '#991b1b' }}>
                                                    Excluir ({selectedStudentIds.size})
                                                </button>
                                            )}
                                        </div>
                                        <ul className="flex-col gap-xs">
                                            {students.filter(s => s.classId === cls.id).map(student => (
                                                <li key={student.id} onClick={() => handleToggleSelectStudent(student.id)} className={`list-item-interactive ${selectedStudentIds.has(student.id) ? 'selected' : ''}`}>
                                                    <div className="flex items-center gap-sm">
                                                        <input type="checkbox" checked={selectedStudentIds.has(student.id)} readOnly />
                                                        <span className={selectedStudentIds.has(student.id) ? 'font-semibold' : ''}>{student.name}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteStudent(student.id, student.name); }} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassManager;
