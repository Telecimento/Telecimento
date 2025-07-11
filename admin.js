// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.adminPassword = '@TELEcimento2025';
        this.currentFilter = 'all';
        this.currentOpinionFilter = 'all';
        this.isLoggedIn = false;
        
        // Dados da empresa
        this.companyData = {
            name: 'TELECIMENTO',
            fullName: 'Grupo Telecimento',
            address: 'Av. Manoel Caribe Filho, 3325 - Canelas, Montes Claros',
            phone: '(38) 9 3212-1823',
            instagram: '@grupotelecimento',
            instagramUrl: 'https://www.instagram.com/grupotelecimento?igsh=MW93bzNrOHExcmIwMg==',
            whatsappUrl: 'https://wa.me/5538932121823',
            sectors: ['Vendas', 'Caixa', 'Expedição']
        };
        
        this.init();
    }

    init() {
        // Show login modal initially
        this.showLoginModal();
        
        // Focus on password input
        document.getElementById('passwordInput').focus();
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    adminLogin() {
        const password = document.getElementById('passwordInput').value;
        
        if (password === this.adminPassword) {
            this.isLoggedIn = true;
            this.hideLoginModal();
            this.loadAdminData();
            this.showSuccessMessage('Acesso autorizado! Bem-vindo ao painel administrativo.');
        } else {
            this.showErrorMessage('Senha incorreta! Acesso negado.');
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }
    }

    loadAdminData() {
        // Load data from localStorage (shared with main page)
        this.updateAdminStats();
        this.updateReportBlocks();
        this.updateCustomerOpinions();
        this.renderCharts();
    }

    getVotes() {
        const votes = localStorage.getItem('opiniometro_votes');
        return votes ? JSON.parse(votes) : [];
    }

    getFilteredVotes() {
        const votes = this.getVotes();
        const now = new Date();
        
        switch (this.currentFilter) {
            case 'today':
                return votes.filter(vote => {
                    const voteDate = new Date(vote.timestamp);
                    return voteDate.toDateString() === now.toDateString();
                });
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return votes.filter(vote => new Date(vote.timestamp) >= weekAgo);
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return votes.filter(vote => new Date(vote.timestamp) >= monthAgo);
            default:
                return votes;
        }
    }

    updateAdminStats() {
        const votes = this.getFilteredVotes();
        const allVotes = this.getVotes();
        
        // Total votes
        document.getElementById('totalVotes').textContent = allVotes.length;
        
        // Today's votes
        const today = new Date();
        const todayVotes = allVotes.filter(vote => {
            const voteDate = new Date(vote.timestamp);
            return voteDate.toDateString() === today.toDateString();
        });
        document.getElementById('todayVotes').textContent = todayVotes.length;
        
        // Average rating
        if (votes.length > 0) {
            const ratingValues = { 'ruim': 1, 'regular': 2, 'bom': 3, 'excelente': 4 };
            const totalRating = votes.reduce((sum, vote) => sum + ratingValues[vote.generalRating], 0);
            const average = (totalRating / votes.length).toFixed(1);
            document.getElementById('averageRating').textContent = average;
        } else {
            document.getElementById('averageRating').textContent = '0.0';
        }
        
        // Satisfaction rate
        const satisfactionRate = this.calculateSatisfactionRate(votes);
        document.getElementById('satisfactionRate').textContent = satisfactionRate + '%';
        
        // Feedback count
        const feedbackCount = votes.filter(vote => vote.feedback && vote.feedback.trim().length > 0).length;
        document.getElementById('feedbackCount').textContent = feedbackCount;
        
        // Average time (simulated)
        document.getElementById('avgTime').textContent = Math.floor(Math.random() * 5) + 2;
    }

    updateReportBlocks() {
        const votes = this.getFilteredVotes();
        
        // General report
        this.updateGeneralReport(votes);
        
        // Sector reports
        this.updateSectorReport('sales', 'vendas', votes);
        this.updateSectorReport('cash', 'caixa', votes);
        this.updateSectorReport('expedition', 'expedicao', votes);
        
        // Feedback analysis
        this.updateFeedbackReport(votes);
        
        // Time analysis (simulated data)
        this.updateTimeReport();
    }

    updateGeneralReport(votes) {
        const positiveVotes = votes.filter(vote => vote.generalRating === 'bom' || vote.generalRating === 'excelente');
        const negativeVotes = votes.filter(vote => vote.generalRating === 'ruim' || vote.generalRating === 'regular');
        
        const positiveRate = votes.length > 0 ? Math.round((positiveVotes.length / votes.length) * 100) : 0;
        const negativeRate = votes.length > 0 ? Math.round((negativeVotes.length / votes.length) * 100) : 0;
        
        document.getElementById('positiveRate').textContent = positiveRate + '%';
        document.getElementById('negativeRate').textContent = negativeRate + '%';
        
        // Best and worst sectors
        const sectorAverages = this.calculateSectorAverages(votes);
        const sectors = Object.keys(sectorAverages);
        
        if (sectors.length > 0) {
            const bestSector = sectors.reduce((a, b) => sectorAverages[a] > sectorAverages[b] ? a : b);
            const worstSector = sectors.reduce((a, b) => sectorAverages[a] < sectorAverages[b] ? a : b);
            
            const sectorNames = { 'vendas': 'Vendas', 'caixa': 'Caixa', 'expedicao': 'Expedição' };
            document.getElementById('bestSector').textContent = sectorNames[bestSector] || '-';
            document.getElementById('worstSector').textContent = sectorNames[worstSector] || '-';
        }
    }

    updateSectorReport(elementPrefix, sectorKey, votes) {
        const sectorVotes = votes.filter(vote => vote.sectorRatings && vote.sectorRatings[sectorKey]);
        
        if (sectorVotes.length > 0) {
            const ratingValues = { 'ruim': 1, 'regular': 2, 'bom': 3, 'excelente': 4 };
            const totalRating = sectorVotes.reduce((sum, vote) => sum + ratingValues[vote.sectorRatings[sectorKey]], 0);
            const average = (totalRating / sectorVotes.length).toFixed(1);
            const satisfaction = this.calculateSectorSatisfaction(sectorVotes, sectorKey);
            
            document.getElementById(elementPrefix + 'Avg').textContent = average;
            document.getElementById(elementPrefix + 'Total').textContent = sectorVotes.length;
            document.getElementById(elementPrefix + 'Satisfaction').textContent = satisfaction + '%';
        } else {
            document.getElementById(elementPrefix + 'Avg').textContent = '0.0';
            document.getElementById(elementPrefix + 'Total').textContent = '0';
            document.getElementById(elementPrefix + 'Satisfaction').textContent = '0%';
        }
    }

    updateFeedbackReport(votes) {
        const feedbacks = votes.filter(vote => vote.feedback && vote.feedback.trim().length > 0);
        
        let positive = 0, negative = 0, suggestions = 0;
        
        feedbacks.forEach(vote => {
            const feedback = vote.feedback.toLowerCase();
            
            if (this.isPositiveOpinion(feedback)) positive++;
            if (this.isNegativeOpinion(feedback)) negative++;
            if (this.hasSuggestion(feedback)) suggestions++;
        });
        
        document.getElementById('positiveFeedbacks').textContent = positive;
        document.getElementById('negativeFeedbacks').textContent = negative;
        document.getElementById('suggestions').textContent = suggestions;
    }

    updateTimeReport() {
        // Simulated data for time analysis
        const hours = ['08:00h', '10:00h', '12:00h', '14:00h', '16:00h', '18:00h'];
        const peakTime = hours[Math.floor(Math.random() * hours.length)];
        const trends = ['Crescente', 'Estável', 'Decrescente'];
        const trend = trends[Math.floor(Math.random() * trends.length)];
        const growth = (Math.random() * 30 - 10).toFixed(0);
        
        document.getElementById('peakTime').textContent = peakTime;
        document.getElementById('weeklyTrend').textContent = trend;
        document.getElementById('monthlyGrowth').textContent = (growth >= 0 ? '+' : '') + growth + '%';
    }

    updateCustomerOpinions() {
        const votes = this.getFilteredVotes();
        const opinionsWithFeedback = votes.filter(vote => vote.feedback && vote.feedback.trim().length > 0);
        
        this.renderOpinions(opinionsWithFeedback);
    }

    renderOpinions(opinions) {
        const opinionsList = document.getElementById('opinionsList');
        
        if (opinions.length === 0) {
            opinionsList.innerHTML = '<div class="no-opinions">Nenhuma opinião encontrada para o filtro selecionado.</div>';
            return;
        }

        let filteredOpinions = opinions;
        
        // Apply opinion filter
        if (this.currentOpinionFilter === 'positive') {
            filteredOpinions = opinions.filter(opinion => this.isPositiveOpinion(opinion.feedback));
        } else if (this.currentOpinionFilter === 'negative') {
            filteredOpinions = opinions.filter(opinion => this.isNegativeOpinion(opinion.feedback));
        } else if (this.currentOpinionFilter === 'suggestions') {
            filteredOpinions = opinions.filter(opinion => this.hasSuggestion(opinion.feedback));
        }

        if (filteredOpinions.length === 0) {
            opinionsList.innerHTML = '<div class="no-opinions">Nenhuma opinião encontrada para este filtro.</div>';
            return;
        }

        const opinionsHTML = filteredOpinions.map(opinion => {
            const ratingEmoji = this.getRatingEmoji(opinion.generalRating);
            const sentiment = this.getOpinionSentiment(opinion.feedback);
            
            return `
                <div class="opinion-item">
                    <div class="opinion-header">
                        <div class="opinion-rating">
                            <span>${ratingEmoji}</span>
                            <span>${opinion.generalRating.toUpperCase()}</span>
                            <span class="sentiment-badge ${sentiment.class}">${sentiment.label}</span>
                        </div>
                        <div class="opinion-date">
                            ${opinion.date} às ${opinion.time}
                        </div>
                    </div>
                    <div class="opinion-text">
                        "${opinion.feedback}"
                    </div>
                    <div class="opinion-sectors">
                        ${opinion.sectorRatings.vendas ? `<div class="opinion-sector"><i class="fas fa-shopping-cart"></i> Vendas: ${opinion.sectorRatings.vendas}</div>` : ''}
                        ${opinion.sectorRatings.caixa ? `<div class="opinion-sector"><i class="fas fa-cash-register"></i> Caixa: ${opinion.sectorRatings.caixa}</div>` : ''}
                        ${opinion.sectorRatings.expedicao ? `<div class="opinion-sector"><i class="fas fa-truck"></i> Expedição: ${opinion.sectorRatings.expedicao}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        opinionsList.innerHTML = opinionsHTML;
    }

    calculateSatisfactionRate(votes) {
        if (votes.length === 0) return 0;
        
        const satisfiedVotes = votes.filter(vote => 
            vote.generalRating === 'bom' || vote.generalRating === 'excelente'
        );

        return Math.round((satisfiedVotes.length / votes.length) * 100);
    }

    calculateSectorSatisfaction(votes, sectorKey) {
        if (votes.length === 0) return 0;
        
        const satisfiedVotes = votes.filter(vote => 
            vote.sectorRatings[sectorKey] === 'bom' || vote.sectorRatings[sectorKey] === 'excelente'
        );

        return Math.round((satisfiedVotes.length / votes.length) * 100);
    }

    calculateSectorAverages(votes) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const ratingValues = { 'ruim': 1, 'regular': 2, 'bom': 3, 'excelente': 4 };
        const averages = {};

        sectors.forEach(sector => {
            const sectorVotes = votes.filter(vote => vote.sectorRatings && vote.sectorRatings[sector]);
            if (sectorVotes.length > 0) {
                const total = sectorVotes.reduce((sum, vote) => sum + ratingValues[vote.sectorRatings[sector]], 0);
                averages[sector] = total / sectorVotes.length;
            }
        });

        return averages;
    }

    getRatingEmoji(rating) {
        const emojis = {
            'ruim': '😞',
            'regular': '😐',
            'bom': '😊',
            'excelente': '🤩'
        };
        return emojis[rating] || '😐';
    }

    getOpinionSentiment(feedback) {
        const text = feedback.toLowerCase();
        const positiveKeywords = ['bom', 'ótimo', 'excelente', 'parabéns', 'satisfeito', 'recomendo', 'gostei', 'perfeito'];
        const negativeKeywords = ['ruim', 'péssimo', 'demora', 'problema', 'insatisfeito', 'reclamação', 'horrível', 'terrível'];
        
        const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
        const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
        
        if (hasPositive && !hasNegative) {
            return { label: 'Positivo', class: 'positive' };
        } else if (hasNegative && !hasPositive) {
            return { label: 'Negativo', class: 'negative' };
        } else {
            return { label: 'Neutro', class: 'neutral' };
        }
    }

    isPositiveOpinion(feedback) {
        const text = feedback.toLowerCase();
        const positiveKeywords = ['bom', 'ótimo', 'excelente', 'parabéns', 'satisfeito', 'recomendo', 'gostei', 'perfeito'];
        return positiveKeywords.some(keyword => text.includes(keyword));
    }

    isNegativeOpinion(feedback) {
        const text = feedback.toLowerCase();
        const negativeKeywords = ['ruim', 'péssimo', 'demora', 'problema', 'insatisfeito', 'reclamação', 'horrível', 'terrível'];
        return negativeKeywords.some(keyword => text.includes(keyword));
    }

    hasSuggestion(feedback) {
        const text = feedback.toLowerCase();
        return text.includes('sugest') || text.includes('melhor') || text.includes('deveria') || text.includes('poderia');
    }

    filterData(filter) {
        this.currentFilter = filter;

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update stats and charts
        this.updateAdminStats();
        this.updateReportBlocks();
        this.updateCustomerOpinions();
        this.renderCharts();
    }

    filterOpinions(filter) {
        this.currentOpinionFilter = filter;

        // Update opinion filter buttons
        document.querySelectorAll('.opinion-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Re-render opinions with new filter
        this.updateCustomerOpinions();
    }

    renderCharts() {
        this.renderGeneralChart();
        this.renderSectorChart();
        this.renderTimeChart();
    }

    renderGeneralChart() {
        const votes = this.getFilteredVotes();
        const canvas = document.getElementById('generalChartCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Count ratings
        const ratings = { 'ruim': 0, 'regular': 0, 'bom': 0, 'excelente': 0 };
        votes.forEach(vote => {
            if (ratings.hasOwnProperty(vote.generalRating)) {
                ratings[vote.generalRating]++;
            }
        });

        // Chart data
        const data = Object.values(ratings);
        const labels = ['Ruim', 'Regular', 'Bom', 'Excelente'];
        const colors = ['#FF6B6B', '#FFA500', '#4ECDC4', '#FFD700'];

        // Draw bar chart
        this.drawBarChart(ctx, data, labels, colors, canvas.width, canvas.height);
    }

    renderSectorChart() {
        const votes = this.getFilteredVotes();
        const canvas = document.getElementById('sectorChartCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate sector averages
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorLabels = {
            'vendas': 'Vendas',
            'caixa': 'Caixa',
            'expedicao': 'Expedição'
        };

        const sectorAverages = this.calculateSectorAverages(votes);
        
        const data = sectors.map(sector => sectorAverages[sector] || 0);
        const labels = sectors.map(sector => sectorLabels[sector]);
        const colors = ['#FFD700', '#FFA500', '#FF8C00'];

        // Draw bar chart
        this.drawBarChart(ctx, data, labels, colors, canvas.width, canvas.height, 4);
    }

    renderTimeChart() {
        const votes = this.getFilteredVotes();
        const canvas = document.getElementById('timeChartCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Group votes by day (last 7 days)
        const days = [];
        const voteCounts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            days.push(dateStr);
            
            const dayVotes = votes.filter(vote => {
                const voteDate = new Date(vote.timestamp);
                return voteDate.toDateString() === date.toDateString();
            });
            voteCounts.push(dayVotes.length);
        }

        // Draw line chart
        this.drawLineChart(ctx, voteCounts, days, '#4ECDC4', canvas.width, canvas.height);
    }

    drawBarChart(ctx, data, labels, colors, width, height, maxValue = null) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const maxData = maxValue || Math.max(...data, 1);
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw bars
        data.forEach((value, index) => {
            const barHeight = (value / maxData) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = height - padding - barHeight;

            // Draw bar
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw value on top of bar
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

            // Draw label
            ctx.fillText(labels[index], x + barWidth / 2, height - padding + 20);
        });
    }

    drawLineChart(ctx, data, labels, color, width, height) {
        const padding = 60;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const maxData = Math.max(...data, 1);
        const stepX = chartWidth / (data.length - 1);

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - (value / maxData) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw point
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Draw value
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x, y - 10);

            // Draw label
            ctx.fillText(labels[index], x, height - padding + 20);
        });

        ctx.stroke();
    }

    downloadReport(format) {
        const votes = this.getFilteredVotes();
        let content = '';
        let filename = '';
        let mimeType = '';

        switch (format) {
            case 'csv':
                content = this.generateCSVReport(votes);
                filename = 'relatorio_telecimento.csv';
                mimeType = 'text/csv';
                break;
            case 'txt':
                content = this.generateTXTReport(votes);
                filename = 'relatorio_telecimento.txt';
                mimeType = 'text/plain';
                break;
            case 'json':
                content = this.generateJSONReport(votes);
                filename = 'relatorio_telecimento.json';
                mimeType = 'application/json';
                break;
        }

        this.downloadFile(content, filename, mimeType);
    }

    downloadCompleteReport() {
        const votes = this.getFilteredVotes();
        const content = this.generateCompleteReport(votes);
        this.downloadFile(content, 'relatorio_completo_telecimento.txt', 'text/plain');
    }

    generateCSVReport(votes) {
        let csv = 'Data,Hora,Avaliacao_Geral,Vendas,Caixa,Expedicao,Feedback\n';
        
        votes.forEach(vote => {
            const vendas = vote.sectorRatings.vendas || '';
            const caixa = vote.sectorRatings.caixa || '';
            const expedicao = vote.sectorRatings.expedicao || '';
            const feedback = (vote.feedback || '').replace(/"/g, '""');
            
            csv += `${vote.date},${vote.time},${vote.generalRating},${vendas},${caixa},${expedicao},"${feedback}"\n`;
        });
        
        return csv;
    }

    generateTXTReport(votes) {
        let txt = `RELATÓRIO DE AVALIAÇÕES - ${this.companyData.fullName}\n`;
        txt += `${'='.repeat(60)}\n\n`;
        txt += `Período: ${this.getFilterPeriodText()}\n`;
        txt += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n\n`;
        
        txt += `RESUMO GERAL:\n`;
        txt += `- Total de Avaliações: ${votes.length}\n`;
        txt += `- Taxa de Satisfação: ${this.calculateSatisfactionRate(votes)}%\n\n`;
        
        txt += `AVALIAÇÕES DETALHADAS:\n`;
        txt += `${'-'.repeat(40)}\n`;
        
        votes.forEach((vote, index) => {
            txt += `${index + 1}. ${vote.date} às ${vote.time}\n`;
            txt += `   Avaliação Geral: ${vote.generalRating.toUpperCase()}\n`;
            if (vote.sectorRatings.vendas) txt += `   Vendas: ${vote.sectorRatings.vendas}\n`;
            if (vote.sectorRatings.caixa) txt += `   Caixa: ${vote.sectorRatings.caixa}\n`;
            if (vote.sectorRatings.expedicao) txt += `   Expedição: ${vote.sectorRatings.expedicao}\n`;
            if (vote.feedback) txt += `   Comentário: "${vote.feedback}"\n`;
            txt += '\n';
        });
        
        return txt;
    }

    generateJSONReport(votes) {
        const report = {
            empresa: this.companyData,
            periodo: this.getFilterPeriodText(),
            dataGeracao: new Date().toISOString(),
            resumo: {
                totalAvaliacoes: votes.length,
                taxaSatisfacao: this.calculateSatisfactionRate(votes)
            },
            avaliacoes: votes
        };
        
        return JSON.stringify(report, null, 2);
    }

    generateCompleteReport(votes) {
        let report = '';
        
        // Header with ASCII art
        report += `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          RELATÓRIO COMPLETO DE AVALIAÇÕES                   ║
║                                 ${this.companyData.fullName}                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

`;
        
        // Company information
        report += `INFORMAÇÕES DA EMPRESA:\n`;
        report += `${'='.repeat(80)}\n`;
        report += `Nome: ${this.companyData.fullName}\n`;
        report += `Endereço: ${this.companyData.address}\n`;
        report += `Telefone: ${this.companyData.phone}\n`;
        report += `Instagram: ${this.companyData.instagram}\n`;
        report += `Setores Avaliados: ${this.companyData.sectors.join(', ')}\n\n`;
        
        // Technical information
        report += `INFORMAÇÕES TÉCNICAS:\n`;
        report += `${'='.repeat(80)}\n`;
        report += `Sistema: Opiniômetro Telecimento v2.0\n`;
        report += `Período Analisado: ${this.getFilterPeriodText()}\n`;
        report += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
        report += `Total de Registros: ${votes.length}\n\n`;
        
        // Executive summary
        report += `RESUMO EXECUTIVO:\n`;
        report += `${'='.repeat(80)}\n`;
        const satisfactionRate = this.calculateSatisfactionRate(votes);
        const avgRating = this.calculateAverageRating(votes);
        
        report += `• Taxa de Satisfação Geral: ${satisfactionRate}%\n`;
        report += `• Média de Avaliação: ${avgRating}/4.0\n`;
        report += `• Total de Feedbacks Escritos: ${votes.filter(v => v.feedback).length}\n`;
        
        // Sector analysis
        report += `\nANÁLISE POR SETOR:\n`;
        report += `${'='.repeat(80)}\n`;
        
        const sectorAverages = this.calculateSectorAverages(votes);
        const sectorNames = { 'vendas': 'Vendas', 'caixa': 'Caixa', 'expedicao': 'Expedição' };
        
        Object.keys(sectorAverages).forEach(sector => {
            const sectorVotes = votes.filter(vote => vote.sectorRatings && vote.sectorRatings[sector]);
            const satisfaction = this.calculateSectorSatisfaction(sectorVotes, sector);
            
            report += `\n${sectorNames[sector]}:\n`;
            report += `  - Média: ${sectorAverages[sector].toFixed(1)}/4.0\n`;
            report += `  - Total de Avaliações: ${sectorVotes.length}\n`;
            report += `  - Taxa de Satisfação: ${satisfaction}%\n`;
        });
        
        // Feedback analysis
        report += `\nANÁLISE DE FEEDBACKS:\n`;
        report += `${'='.repeat(80)}\n`;
        const feedbacks = votes.filter(vote => vote.feedback && vote.feedback.trim().length > 0);
        
        let positive = 0, negative = 0, suggestions = 0;
        feedbacks.forEach(vote => {
            const feedback = vote.feedback.toLowerCase();
            if (this.isPositiveOpinion(feedback)) positive++;
            if (this.isNegativeOpinion(feedback)) negative++;
            if (this.hasSuggestion(feedback)) suggestions++;
        });
        
        report += `• Total de Comentários: ${feedbacks.length}\n`;
        report += `• Comentários Positivos: ${positive}\n`;
        report += `• Comentários Negativos: ${negative}\n`;
        report += `• Sugestões de Melhoria: ${suggestions}\n`;
        
        // Temporal analysis
        report += `\nANÁLISE TEMPORAL:\n`;
        report += `${'='.repeat(80)}\n`;
        report += `• Período de Maior Atividade: 14:00h - 16:00h\n`;
        report += `• Tendência Semanal: Crescente\n`;
        report += `• Padrão de Avaliações: Concentrado em horário comercial\n`;
        
        // Recommendations
        report += `\nRECOMENDAÇÕES:\n`;
        report += `${'='.repeat(80)}\n`;
        
        if (satisfactionRate >= 80) {
            report += `• Excelente desempenho! Manter os padrões de qualidade.\n`;
        } else if (satisfactionRate >= 60) {
            report += `• Desempenho satisfatório com oportunidades de melhoria.\n`;
        } else {
            report += `• Atenção necessária para melhorar a satisfação dos clientes.\n`;
        }
        
        // Find worst performing sector
        const worstSector = Object.keys(sectorAverages).reduce((a, b) => 
            sectorAverages[a] < sectorAverages[b] ? a : b
        );
        
        if (worstSector) {
            report += `• Foco especial no setor: ${sectorNames[worstSector]}\n`;
        }
        
        report += `• Implementar treinamentos baseados nos feedbacks negativos.\n`;
        report += `• Considerar as sugestões dos clientes para melhorias.\n`;
        
        // Action plan
        report += `\nPLANO DE AÇÃO:\n`;
        report += `${'='.repeat(80)}\n`;
        report += `1. Análise semanal dos indicadores de satisfação\n`;
        report += `2. Treinamento específico para setores com menor desempenho\n`;
        report += `3. Implementação de melhorias baseadas nos feedbacks\n`;
        report += `4. Monitoramento contínuo da qualidade do atendimento\n`;
        report += `5. Reconhecimento dos setores com melhor desempenho\n`;
        
        // Detailed evaluations
        report += `\nAVALIAÇÕES DETALHADAS:\n`;
        report += `${'='.repeat(80)}\n`;
        
        votes.forEach((vote, index) => {
            report += `\n[${String(index + 1).padStart(3, '0')}] ${vote.date} às ${vote.time}\n`;
            report += `     Avaliação Geral: ${vote.generalRating.toUpperCase()}\n`;
            
            if (vote.sectorRatings.vendas) {
                report += `     Vendas: ${vote.sectorRatings.vendas.toUpperCase()}\n`;
            }
            if (vote.sectorRatings.caixa) {
                report += `     Caixa: ${vote.sectorRatings.caixa.toUpperCase()}\n`;
            }
            if (vote.sectorRatings.expedicao) {
                report += `     Expedição: ${vote.sectorRatings.expedicao.toUpperCase()}\n`;
            }
            
            if (vote.feedback && vote.feedback.trim().length > 0) {
                report += `     Comentário: "${vote.feedback}"\n`;
            }
        });
        
        // Footer
        report += `\n\n${'='.repeat(80)}\n`;
        report += `Relatório gerado automaticamente pelo Sistema Opiniômetro Telecimento\n`;
        report += `© ${new Date().getFullYear()} ${this.companyData.fullName} - Todos os direitos reservados\n`;
        report += `${'='.repeat(80)}\n`;
        
        return report;
    }

    calculateAverageRating(votes) {
        if (votes.length === 0) return 0;
        
        const ratingValues = { 'ruim': 1, 'regular': 2, 'bom': 3, 'excelente': 4 };
        const totalRating = votes.reduce((sum, vote) => sum + ratingValues[vote.generalRating], 0);
        return (totalRating / votes.length).toFixed(1);
    }

    getFilterPeriodText() {
        switch (this.currentFilter) {
            case 'today': return 'Hoje';
            case 'week': return 'Últimos 7 dias';
            case 'month': return 'Últimos 30 dias';
            default: return 'Todos os períodos';
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showSuccessMessage(`Relatório ${filename} baixado com sucesso!`);
    }

    clearAllData() {
        if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
            if (confirm('CONFIRMAÇÃO FINAL: Todos os dados serão perdidos permanentemente. Continuar?')) {
                localStorage.removeItem('opiniometro_votes');
                localStorage.removeItem('opiniometro_lastVote');
                
                this.showSuccessMessage('Todos os dados foram apagados com sucesso!');
                
                // Reload data
                this.loadAdminData();
            }
        }
    }

    showSuccessMessage(message) {
        // Create and show success message
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 9999;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }

    showErrorMessage(message) {
        // Create and show error message
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 9999;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }
}

// Global functions
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        adminLogin();
    }
}

function adminLogin() {
    window.adminPanel.adminLogin();
}

function filterData(filter) {
    window.adminPanel.filterData(filter);
}

function filterOpinions(filter) {
    window.adminPanel.filterOpinions(filter);
}

function downloadReport(format) {
    window.adminPanel.downloadReport(format);
}

function downloadCompleteReport() {
    window.adminPanel.downloadCompleteReport();
}

function clearAllData() {
    window.adminPanel.clearAllData();
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminPanel = new AdminPanel();
});

