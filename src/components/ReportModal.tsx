import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Download } from 'lucide-react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const { classes, students, fetchAttendanceForReport } = useAppContext();

    // States
    const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
    const [dateMode, setDateMode] = useState<'single' | 'period'>('single');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [onlyAbsences, setOnlyAbsences] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleToggleClass = (id: string) => {
        const newSet = new Set(selectedClassIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedClassIds(newSet);
    };

    const handleSelectAllClasses = () => {
        if (selectedClassIds.size === classes.length) {
            setSelectedClassIds(new Set());
        } else {
            setSelectedClassIds(new Set(classes.map(c => c.id)));
        }
    };

    const handleGenerateReport = async () => {
        if (selectedClassIds.size === 0) {
            alert('Selecione pelo menos uma turma.');
            return;
        }

        setIsGenerating(true);
        try {
            const targetClassIds = Array.from(selectedClassIds);
            // Fetch data before processing
            const fetchedAttendance = await fetchAttendanceForReport(targetClassIds, startDate, dateMode === 'single' ? startDate : endDate);

            let csvContent = "Data,Turma,Nome do Aluno,Status\n";
            let hasData = false;

            // Filter attendance records 
            // We use the fetched data directly to avoid closure issues with context state
            const filteredAttendance = fetchedAttendance.filter(record => {
                const isClassMatch = targetClassIds.includes(record.classId);
                if (!isClassMatch) return false;

                // Simple string comparison works perfectly for YYYY-MM-DD format
                // and avoids all timezone conversion headaches
                if (dateMode === 'single') {
                    return record.date === startDate;
                } else {
                    return record.date >= startDate && record.date <= endDate;
                }
            });

            // Sort by date desc, then class name asc
            filteredAttendance.sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateDiff !== 0) return dateDiff;

                const classA = classes.find(c => c.id === a.classId)?.name || '';
                const classB = classes.find(c => c.id === b.classId)?.name || '';
                return classA.localeCompare(classB);
            });

            filteredAttendance.forEach(record => {
                const classObj = classes.find(c => c.id === record.classId);
                const className = classObj?.name || 'Desconhecida';

                // Fix timezone issue
                const [year, month, day] = record.date.split('-');
                const recordDate = `${day}/${month}/${year}`;

                // Get students for this class
                const classStudents = students.filter(s => s.classId === record.classId);

                classStudents.forEach(student => {
                    const isPresent = record.records[student.id] !== false; // Default true is present

                    if (onlyAbsences && isPresent) return; // Skip if we only want absences and student is present

                    const statusLabel = isPresent ? 'Presente' : 'Ausente';
                    csvContent += `${recordDate},"${className}","${student.name}",${statusLabel}\n`;
                    hasData = true;
                });
            });

            if (!hasData) {
                alert(onlyAbsences
                    ? 'Nenhuma falta encontrada para os filtros selecionados.'
                    : 'Nenhum registro de presença encontrado para os filtros selecionados.');
                return;
            }

            // Trigger Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `relatorio_frequencia_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerating(false);
            onClose();
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Erro ao gerar relatório. Tente novamente.');
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gerar Relatório</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '20px' }}>

                    {/* Date Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <label className="label" style={{ marginBottom: '10px', display: 'block' }}>Período</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                className={`btn ${dateMode === 'single' ? 'btn-primary' : ''}`}
                                onClick={() => setDateMode('single')}
                                style={{ flex: 1, backgroundColor: dateMode === 'single' ? undefined : '#f1f5f9', color: dateMode === 'single' ? undefined : '#64748b' }}
                            >
                                Data Única
                            </button>
                            <button
                                className={`btn ${dateMode === 'period' ? 'btn-primary' : ''}`}
                                onClick={() => setDateMode('period')}
                                style={{ flex: 1, backgroundColor: dateMode === 'period' ? undefined : '#f1f5f9', color: dateMode === 'period' ? undefined : '#64748b' }}
                            >
                                Período
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="date"
                                    className="input"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            {dateMode === 'period' && (
                                <>
                                    <span style={{ color: '#94a3b8' }}>até</span>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="date"
                                            className="input"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Class Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label className="label" style={{ margin: 0 }}>Turmas</label>
                            <button
                                onClick={handleSelectAllClasses}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                            >
                                {selectedClassIds.size === classes.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                            </button>
                        </div>

                        <div style={{
                            maxHeight: '150px',
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px'
                        }}>
                            {classes.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '8px' }}>Nenhuma turma cadastrada.</p>}
                            {classes.map(cls => (
                                <div key={cls.id} style={{ padding: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id={`cls-${cls.id}`}
                                        checked={selectedClassIds.has(cls.id)}
                                        onChange={() => handleToggleClass(cls.id)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor={`cls-${cls.id}`} style={{ cursor: 'pointer', fontSize: '0.95rem', flex: 1 }}>{cls.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="onlyAbsences"
                                checked={onlyAbsences}
                                onChange={e => setOnlyAbsences(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="onlyAbsences" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>Apenas alunos ausentes</label>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        className={`btn ${isGenerating ? '' : 'btn-primary'}`}
                        disabled={isGenerating}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: isGenerating ? 0.7 : 1,
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            backgroundColor: isGenerating ? '#cbd5e1' : undefined
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Baixar Relatório CSV
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default ReportModal;
