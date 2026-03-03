import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import type { Class } from '../types';

interface StudentImporterProps {
    classes: Class[];
    onImport: (classId: string, names: string[]) => Promise<void>;
}

const StudentImporter: React.FC<StudentImporterProps> = ({ classes, onImport }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId || !csvFile) return;

        setIsProcessing(true);
        try {
            const text = await csvFile.text();
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

            let headerIndex = -1;
            let separator = ',';
            let nameColIndex = -1;

            for (let i = 0; i < Math.min(lines.length, 20); i++) {
                const line = lines[i].toLowerCase();
                const possibleSeparators = [';', ',', '\t'];
                for (const sep of possibleSeparators) {
                    const cols = line.split(sep).map(c => c.trim());
                    const index = cols.findIndex(c =>
                        c === 'nome do aluno' || c === 'nome' || c === 'student name' || c.includes('nome do aluno')
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

            const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;
            if (nameColIndex === -1) nameColIndex = 0;

            const namesToImport: string[] = [];
            for (let i = startRow; i < lines.length; i++) {
                const columns = lines[i].split(separator).map(c => c.trim());
                if (columns.length > nameColIndex) {
                    let name = columns[nameColIndex].replace(/^["']|["']$/g, '');
                    if (name && name.length > 2 && isNaN(Number(name))) {
                        namesToImport.push(name);
                    }
                }
            }

            if (namesToImport.length > 0) {
                await onImport(selectedClassId, namesToImport);
                setCsvFile(null);
                // Reset file input
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            console.error('CSV Import Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="card mb-lg">
            <h3 className="mb-md flex items-center gap-sm">
                <Upload size={20} /> Importar Alunos
            </h3>
            <p className="text-sm text-secondary mb-md">
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
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        className="input p-sm"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={isProcessing || !selectedClassId || !csvFile}>
                    {isProcessing ? 'Processando...' : 'Importar Alunos'}
                </button>
            </form>
        </div>
    );
};

export default StudentImporter;
