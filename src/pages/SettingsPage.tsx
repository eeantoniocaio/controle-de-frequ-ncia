import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ClassManager from '../components/ClassManager';
import StudentImporter from '../components/StudentImporter';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';


const SettingsPage: React.FC = () => {
    const {
        classes, students, loading,
        addClass, updateClass, addStudentsFromCSV,
        deleteClass, deleteStudent, deleteStudents
    } = useAppContext();

    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    if (loading) {
        return (
            <div className="container flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <div className="spinner mb-md"></div>
                    <p className="text-secondary">Carregando configurações...</p>
                </div>
            </div>
        );
    }

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

    const handleAddClass = async (name: string) => {
        try {
            await addClass(name);
            showToast('Turma criada com sucesso!');
        } catch (err: unknown) {
            const error = err as Error;
            showToast(`Erro ao criar turma: ${error.message}`, 'error');
        }
    };

    const handleUpdateClass = async (id: string, name: string) => {
        try {
            await updateClass(id, name);
            showToast('Nome da turma atualizado.');
        } catch (err: unknown) {
            showToast('Erro ao atualizar turma.', 'error');
        }
    };

    const handleImportStudents = async (classId: string, names: string[]) => {
        try {
            await addStudentsFromCSV(classId, names);
            showToast(`${names.length} alunos importados com sucesso!`);
        } catch (err: unknown) {
            showToast('Erro ao importar alunos.', 'error');
        }
    };

    const handleDeleteClass = (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a turma "${name}"? Todos os alunos e registros de presença serão perdidos.`)) {
            deleteClass(id);
            showToast(`Turma ${name} excluída.`);
        }
    };

    const handleDeleteStudent = (id: string, name: string) => {
        if (window.confirm(`Remover aluno "${name}"?`)) {
            deleteStudent(id);
            showToast(`Aluno ${name} removido.`);
        }
    };

    const handleDeleteStudents = (ids: string[]) => {
        if (window.confirm(`Tem certeza que deseja excluir ${ids.length} alunos selecionados?`)) {
            deleteStudents(ids);
            showToast('Alunos excluídos.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            <header className="page-header">
                <h2 className="page-title">Configurações</h2>
            </header>

            <ClassManager
                classes={classes}
                students={students}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onDeleteClass={handleDeleteClass}
                onDeleteStudent={handleDeleteStudent}
                onDeleteStudents={handleDeleteStudents}
            />

            <div className="mb-lg"></div>

            <StudentImporter
                classes={classes}
                onImport={handleImportStudents}
            />

            <div className="text-center text-secondary text-sm" style={{ marginTop: 'var(--spacing-lg)' }}>
                <p><strong>Nota:</strong> Arquivos com cabeçalho "Nome" ou "Nome do Aluno" são detectados automaticamente.</p>
            </div>

            {toast && (
                <div className="toast-container">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

