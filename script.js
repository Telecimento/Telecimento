// Sistema de Opiniômetro Telecimento - Versão Completa com Relatórios em Bloco de Notas
class OpiniometroSystem {
    constructor() {
        this.currentRating = null;
        this.sectorRatings = {};
        this.feedback = '';
        this.lastVoteTime = null;
        this.votes = this.loadVotes();
        this.currentFilter = 'all';
        this.isAdminLoggedIn = false;
        this.adminPassword = '@TELEcimento2025';
        
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
        
        this.currentOpinionFilter = 'all';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkVotingEligibility();
        this.loadDemoData();
    }

    setupEventListeners() {
        // Rating options
        document.querySelectorAll('.rating-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectRating(e.currentTarget);
            });
        });

        // Sector options
        document.querySelectorAll('.sector-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectSectorRating(e.currentTarget);
            });
        });

        // Feedback textarea
        const feedbackTextarea = document.getElementById('feedbackText');
        if (feedbackTextarea) {
            feedbackTextarea.addEventListener('input', (e) => {
                this.feedback = e.target.value;
            });
        }

        // Password input enter key
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.validatePassword();
                }
            });
        }
    }

    selectRating(element) {
        // Remove previous selection
        document.querySelectorAll('.rating-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selection to clicked element
        element.classList.add('selected');
        this.currentRating = element.dataset.rating;

        // Add animation
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    selectSectorRating(element) {
        const sector = element.dataset.sector;
        const rating = element.dataset.rating;

        // Remove previous selection for this sector
        document.querySelectorAll(`[data-sector="${sector}"]`).forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selection to clicked element
        element.classList.add('selected');
        this.sectorRatings[sector] = rating;

        // Add animation
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    checkVotingEligibility() {
        const lastVote = localStorage.getItem('telecimento_lastVoteTime');
        const now = new Date().getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (lastVote && (now - parseInt(lastVote)) < twentyFourHours) {
            const timeLeft = twentyFourHours - (now - parseInt(lastVote));
            const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
            
            this.showMessage(
                `Você já votou hoje! Poderá votar novamente em ${hoursLeft} horas.`,
                'warning'
            );
            
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('submitBtn').innerHTML = `
                <i class="fas fa-clock"></i>
                Aguarde ${hoursLeft}h para votar novamente
            `;
            return false;
        }
        return true;
    }

    submitRating() {
        if (!this.checkVotingEligibility()) {
            return;
        }

        if (!this.currentRating) {
            this.showMessage('Por favor, selecione uma avaliação geral!', 'error');
            return;
        }

        // Create vote object
        const vote = {
            id: this.generateId(),
            timestamp: new Date().getTime(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR'),
            generalRating: this.currentRating,
            sectorRatings: { ...this.sectorRatings },
            feedback: this.feedback,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent.substring(0, 50)
        };

        // Save vote
        this.votes.push(vote);
        this.saveVotes();

        // Update last vote time
        localStorage.setItem('telecimento_lastVoteTime', vote.timestamp.toString());

        // Show success message
        this.showMessage('Obrigado pela sua avaliação! Sua opinião é muito importante para nós.', 'success');

        // Reset form
        this.resetForm();

        // Update admin stats if panel is open
        if (this.isAdminLoggedIn) {
            this.updateAdminStats();
            this.updateReportBlocks();
            this.renderCharts();
        }

        // Disable submit button
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').innerHTML = `
            <i class="fas fa-check"></i>
            Avaliação Enviada
        `;
    }

    resetForm() {
        // Reset general rating
        document.querySelectorAll('.rating-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Reset sector ratings
        document.querySelectorAll('.sector-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Reset feedback
        document.getElementById('feedbackText').value = '';

        // Reset internal state
        this.currentRating = null;
        this.sectorRatings = {};
        this.feedback = '';
    }

    // Login/Admin Functions
    showLoginModal() {
        document.getElementById('loginModal').style.display = 'block';
        document.getElementById('passwordInput').focus();
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('passwordInput').value = '';
    }

    validatePassword() {
        const password = document.getElementById('passwordInput').value;
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            this.hideLoginModal();
            this.openAdmin();
            this.showMessage('Acesso autorizado! Bem-vindo ao painel administrativo.', 'success');
        } else {
            this.showMessage('Senha incorreta! Acesso negado.', 'error');
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }
    }

    openAdmin() {
        if (!this.isAdminLoggedIn) {
            this.showLoginModal();
            return;
        }

        document.getElementById('adminPanel').style.display = 'block';
        this.updateAdminStats();
        this.updateReportBlocks();
        this.renderCharts();
    }

    closeAdmin() {
        document.getElementById('adminPanel').style.display = 'none';
        this.isAdminLoggedIn = false;
    }

    clearAllData() {
        if (!this.isAdminLoggedIn) {
            this.showMessage('Acesso negado!', 'error');
            return;
        }

        if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados de avaliações permanentemente. Deseja continuar?')) {
            if (confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) {
                // Backup data before clearing
                const backup = {
                    timestamp: new Date().toISOString(),
                    data: [...this.votes]
                };
                localStorage.setItem('telecimento_backup', JSON.stringify(backup));

                // Clear all data
                this.votes = [];
                this.saveVotes();
                localStorage.removeItem('telecimento_lastVoteTime');

                // Update interface
                this.updateAdminStats();
                this.updateReportBlocks();
                this.renderCharts();

                this.showMessage('Todos os dados foram apagados com sucesso! Backup salvo automaticamente.', 'success');
            }
        }
    }

    loadVotes() {
        const stored = localStorage.getItem('telecimento_votes');
        return stored ? JSON.parse(stored) : [];
    }

    saveVotes() {
        localStorage.setItem('telecimento_votes', JSON.stringify(this.votes));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getClientIP() {
        // Simulated IP for demo purposes
        return '192.168.1.' + Math.floor(Math.random() * 255);
    }

    showMessage(text, type = 'info') {
        const container = document.getElementById('messageContainer');
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        container.appendChild(message);

        // Show message
        setTimeout(() => {
            message.classList.add('show');
        }, 100);

        // Hide message after 5 seconds
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (container.contains(message)) {
                    container.removeChild(message);
                }
            }, 300);
        }, 5000);
    }

    // Admin Panel Functions
    updateAdminStats() {
        const filteredVotes = this.getFilteredVotes();
        const today = new Date().toISOString().split('T')[0];
        const todayVotes = this.votes.filter(vote => vote.date === today);

        // Basic stats
        document.getElementById('totalVotes').textContent = this.votes.length;
        document.getElementById('todayVotes').textContent = todayVotes.length;

        // Average rating
        const avgRating = this.calculateAverageRating(filteredVotes);
        document.getElementById('avgRating').textContent = avgRating.toFixed(1);

        // Satisfaction rate (bom + excelente)
        const satisfactionRate = this.calculateSatisfactionRate(filteredVotes);
        document.getElementById('satisfactionRate').textContent = satisfactionRate + '%';

        // Feedback count
        const feedbackCount = filteredVotes.filter(vote => vote.feedback && vote.feedback.trim().length > 0).length;
        document.getElementById('feedbackCount').textContent = feedbackCount;

        // Average response time (simulated)
        const avgResponseTime = Math.floor(Math.random() * 5) + 2;
        document.getElementById('avgResponseTime').textContent = avgResponseTime;
    }

    updateReportBlocks() {
        const filteredVotes = this.getFilteredVotes();
        
        // General Summary
        this.updateGeneralSummary(filteredVotes);
        
        // Sector Reports
        this.updateSectorReports(filteredVotes);
        
        // Feedback Analysis
        this.updateFeedbackAnalysis(filteredVotes);
        
        // Time Analysis
        this.updateTimeAnalysis(filteredVotes);
    }

    updateGeneralSummary(votes) {
        const positiveVotes = votes.filter(vote => 
            vote.generalRating === 'bom' || vote.generalRating === 'excelente'
        );
        const negativeVotes = votes.filter(vote => 
            vote.generalRating === 'ruim' || vote.generalRating === 'regular'
        );

        const positiveRate = votes.length > 0 ? Math.round((positiveVotes.length / votes.length) * 100) : 0;
        const negativeRate = votes.length > 0 ? Math.round((negativeVotes.length / votes.length) * 100) : 0;

        document.getElementById('positiveRatings').textContent = positiveRate + '%';
        document.getElementById('negativeRatings').textContent = negativeRate + '%';

        // Best and worst sectors
        const sectorAverages = this.calculateSectorAverages(votes);
        const sectors = Object.keys(sectorAverages);
        
        if (sectors.length > 0) {
            const bestSector = sectors.reduce((a, b) => sectorAverages[a] > sectorAverages[b] ? a : b);
            const worstSector = sectors.reduce((a, b) => sectorAverages[a] < sectorAverages[b] ? a : b);
            
            document.getElementById('bestSector').textContent = this.getSectorName(bestSector);
            document.getElementById('worstSector').textContent = this.getSectorName(worstSector);
        }
    }

    updateSectorReports(votes) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorNames = {
            'vendas': 'sales',
            'caixa': 'cash',
            'expedicao': 'shipping'
        };

        sectors.forEach(sector => {
            const sectorVotes = votes.filter(vote => vote.sectorRatings[sector]);
            const avg = this.calculateSectorAverage(votes, sector);
            const satisfaction = this.calculateSectorSatisfaction(votes, sector);
            
            const prefix = sectorNames[sector];
            document.getElementById(`${prefix}Avg`).textContent = avg.toFixed(1);
            document.getElementById(`${prefix}Total`).textContent = sectorVotes.length;
            document.getElementById(`${prefix}Satisfaction`).textContent = satisfaction + '%';
        });
    }

    updateFeedbackAnalysis(votes) {
        const feedbacks = votes.filter(vote => vote.feedback && vote.feedback.trim().length > 0);
        
        // Simple sentiment analysis based on keywords
        const positiveKeywords = ['bom', 'ótimo', 'excelente', 'parabéns', 'satisfeito', 'recomendo'];
        const negativeKeywords = ['ruim', 'péssimo', 'demora', 'problema', 'insatisfeito', 'reclamação'];
        
        let positiveFeedbacks = 0;
        let negativeFeedbacks = 0;
        let suggestions = 0;

        feedbacks.forEach(vote => {
            const text = vote.feedback.toLowerCase();
            const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
            const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
            const hasSuggestion = text.includes('sugest') || text.includes('melhor') || text.includes('deveria');

            if (hasPositive) positiveFeedbacks++;
            if (hasNegative) negativeFeedbacks++;
            if (hasSuggestion) suggestions++;
        });

        document.getElementById('positiveFeedbacks').textContent = positiveFeedbacks;
        document.getElementById('negativeFeedbacks').textContent = negativeFeedbacks;
        document.getElementById('suggestions').textContent = suggestions;
    }

    updateTimeAnalysis(votes) {
        if (votes.length === 0) {
            document.getElementById('peakTime').textContent = '-';
            document.getElementById('weeklyTrend').textContent = '-';
            document.getElementById('monthlyGrowth').textContent = '0%';
            return;
        }

        // Peak time analysis
        const hourCounts = {};
        votes.forEach(vote => {
            const hour = new Date(vote.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        document.getElementById('peakTime').textContent = `${peakHour}:00h`;

        // Weekly trend
        const lastWeek = votes.filter(vote => {
            const voteDate = new Date(vote.timestamp);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return voteDate >= weekAgo;
        });

        const trend = lastWeek.length > votes.length / 2 ? 'Crescente' : 'Estável';
        document.getElementById('weeklyTrend').textContent = trend;

        // Monthly growth (simulated)
        const growth = Math.floor(Math.random() * 20) + 5;
        document.getElementById('monthlyGrowth').textContent = `+${growth}%`;
    }

    getSectorName(sector) {
        const names = {
            'vendas': 'Vendas',
            'caixa': 'Setor de Caixa',
            'expedicao': 'Expedição'
        };
        return names[sector] || sector;
    }

    calculateSectorAverages(votes) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const ratingValues = {
            'ruim': 1,
            'regular': 2,
            'bom': 3,
            'excelente': 4
        };

        const averages = {};
        sectors.forEach(sector => {
            const sectorVotes = votes.filter(vote => vote.sectorRatings[sector]);
            if (sectorVotes.length > 0) {
                const sum = sectorVotes.reduce((acc, vote) => {
                    return acc + (ratingValues[vote.sectorRatings[sector]] || 0);
                }, 0);
                averages[sector] = sum / sectorVotes.length;
            } else {
                averages[sector] = 0;
            }
        });

        return averages;
    }

    calculateSectorAverage(votes, sector) {
        const ratingValues = {
            'ruim': 1,
            'regular': 2,
            'bom': 3,
            'excelente': 4
        };

        const sectorVotes = votes.filter(vote => vote.sectorRatings[sector]);
        if (sectorVotes.length === 0) return 0;

        const sum = sectorVotes.reduce((acc, vote) => {
            return acc + (ratingValues[vote.sectorRatings[sector]] || 0);
        }, 0);

        return sum / sectorVotes.length;
    }

    calculateSectorSatisfaction(votes, sector) {
        const sectorVotes = votes.filter(vote => vote.sectorRatings[sector]);
        if (sectorVotes.length === 0) return 0;

        const satisfiedVotes = sectorVotes.filter(vote => 
            vote.sectorRatings[sector] === 'bom' || vote.sectorRatings[sector] === 'excelente'
        );

        return Math.round((satisfiedVotes.length / sectorVotes.length) * 100);
    }

    getFilteredVotes() {
        const now = new Date();
        const today = new Date().toISOString().split('T')[0];

        switch (this.currentFilter) {
            case 'today':
                return this.votes.filter(vote => vote.date === today);
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return this.votes.filter(vote => new Date(vote.timestamp) >= weekAgo);
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return this.votes.filter(vote => new Date(vote.timestamp) >= monthAgo);
            default:
                return this.votes;
        }
    }

    calculateAverageRating(votes) {
        if (votes.length === 0) return 0;

        const ratingValues = {
            'ruim': 1,
            'regular': 2,
            'bom': 3,
            'excelente': 4
        };

        const sum = votes.reduce((acc, vote) => {
            return acc + (ratingValues[vote.generalRating] || 0);
        }, 0);

        return sum / votes.length;
    }

    calculateSatisfactionRate(votes) {
        if (votes.length === 0) return 0;

        const satisfiedVotes = votes.filter(vote => 
            vote.generalRating === 'bom' || vote.generalRating === 'excelente'
        );

        return Math.round((satisfiedVotes.length / votes.length) * 100);
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
        const canvas = document.getElementById('generalChartCanvas');
        const ctx = canvas.getContext('2d');
        const votes = this.getFilteredVotes();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Count ratings
        const counts = {
            'ruim': 0,
            'regular': 0,
            'bom': 0,
            'excelente': 0
        };

        votes.forEach(vote => {
            if (counts.hasOwnProperty(vote.generalRating)) {
                counts[vote.generalRating]++;
            }
        });

        // Chart settings
        const colors = {
            'ruim': '#ff4444',
            'regular': '#ff9800',
            'bom': '#4CAF50',
            'excelente': '#FFD700'
        };

        const labels = {
            'ruim': 'Ruim',
            'regular': 'Regular',
            'bom': 'Bom',
            'excelente': 'Excelente'
        };

        // Draw bar chart
        const maxCount = Math.max(...Object.values(counts), 1);
        const barWidth = 150;
        const barSpacing = 50;
        const chartHeight = 200;
        const startX = 50;
        const startY = 250;

        Object.keys(counts).forEach((rating, index) => {
            const barHeight = (counts[rating] / maxCount) * chartHeight;
            const x = startX + index * (barWidth + barSpacing);
            const y = startY - barHeight;

            // Draw bar
            ctx.fillStyle = colors[rating];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(labels[rating], x + barWidth / 2, startY + 20);

            // Draw count
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Inter';
            ctx.fillText(counts[rating], x + barWidth / 2, y - 10);
        });
    }

    renderSectorChart() {
        const canvas = document.getElementById('sectorChartCanvas');
        const ctx = canvas.getContext('2d');
        const votes = this.getFilteredVotes();

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

        // Draw bar chart
        const maxRating = 4;
        const barWidth = 200;
        const barSpacing = 50;
        const chartHeight = 200;
        const startX = 50;
        const startY = 250;

        const colors = ['#FFD700', '#FFA500', '#FF8C00'];

        sectors.forEach((sector, index) => {
            const barHeight = (sectorAverages[sector] / maxRating) * chartHeight;
            const x = startX + index * (barWidth + barSpacing);
            const y = startY - barHeight;

            // Draw bar
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(sectorLabels[sector], x + barWidth / 2, startY + 20);

            // Draw average
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Inter';
            ctx.fillText(sectorAverages[sector].toFixed(1), x + barWidth / 2, y - 10);
        });
    }

    renderTimeChart() {
        const canvas = document.getElementById('timeChartCanvas');
        const ctx = canvas.getContext('2d');
        const votes = this.getFilteredVotes();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (votes.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado disponível', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Group votes by date
        const votesByDate = {};
        votes.forEach(vote => {
            const date = vote.date;
            if (!votesByDate[date]) {
                votesByDate[date] = [];
            }
            votesByDate[date].push(vote);
        });

        // Get last 7 days
        const dates = Object.keys(votesByDate).sort().slice(-7);
        const counts = dates.map(date => votesByDate[date].length);

        if (dates.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado disponível', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Draw line chart
        const maxCount = Math.max(...counts, 1);
        const chartWidth = 600;
        const chartHeight = 200;
        const startX = 100;
        const startY = 250;
        const pointSpacing = chartWidth / (dates.length - 1 || 1);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = startY - (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + chartWidth, y);
            ctx.stroke();
        }

        // Draw line
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();

        counts.forEach((count, index) => {
            const x = startX + index * pointSpacing;
            const y = startY - (count / maxCount) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw point
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw count label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(count, x, y - 15);

            // Draw date label
            const shortDate = dates[index].split('-').slice(1).join('/');
            ctx.fillText(shortDate, x, startY + 20);
        });

        ctx.stroke();
    }

    // Download Functions
    downloadReport(format = 'csv') {
        const votes = this.getFilteredVotes();
        const timestamp = new Date().toISOString().split('T')[0];

        switch (format) {
            case 'csv':
                this.downloadCSV(votes, timestamp);
                break;
            case 'txt':
                this.downloadTXT(votes, timestamp);
                break;
            case 'json':
                this.downloadJSON(votes, timestamp);
                break;
        }
    }

    downloadCSV(votes, timestamp) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Data,Hora,Avaliação Geral,Vendas,Setor de Caixa,Expedição,Feedback,IP\n";

        votes.forEach(vote => {
            const row = [
                vote.date,
                vote.time || '',
                vote.generalRating,
                vote.sectorRatings.vendas || '',
                vote.sectorRatings.caixa || '',
                vote.sectorRatings.expedicao || '',
                `"${(vote.feedback || '').replace(/"/g, '""')}"`,
                vote.ip || ''
            ].join(',');
            csvContent += row + "\n";
        });

        this.downloadFile(csvContent, `relatorio_telecimento_${timestamp}.csv`);
    }

    downloadTXT(votes, timestamp) {
        const content = this.generateNotebookReport(votes);
        const txtContent = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        this.downloadFile(txtContent, `relatorio_telecimento_${timestamp}.txt`);
    }

    downloadJSON(votes, timestamp) {
        const jsonData = {
            company: this.companyData,
            reportDate: new Date().toISOString(),
            filter: this.currentFilter,
            totalVotes: votes.length,
            votes: votes,
            statistics: this.generateStatistics(votes)
        };

        const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
        this.downloadFile(jsonContent, `relatorio_telecimento_${timestamp}.json`);
    }

    downloadCompleteReport() {
        const votes = this.getFilteredVotes();
        const content = this.generateCompleteNotebookReport(votes);
        const timestamp = new Date().toISOString().split('T')[0];
        const txtContent = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        this.downloadFile(txtContent, `relatorio_completo_telecimento_${timestamp}.txt`);
    }

    generateNotebookReport(votes) {
        const now = new Date();
        const stats = this.generateStatistics(votes);

        let content = `
═══════════════════════════════════════════════════════════════════════════════
                            RELATÓRIO DE AVALIAÇÕES
                                 ${this.companyData.name}
═══════════════════════════════════════════════════════════════════════════════

DADOS DA EMPRESA:
─────────────────────────────────────────────────────────────────────────────
Nome: ${this.companyData.fullName}
Endereço: ${this.companyData.address}
Telefone: ${this.companyData.phone}
Instagram: ${this.companyData.instagram}
Setores Avaliados: ${this.companyData.sectors.join(', ')}

INFORMAÇÕES DO RELATÓRIO:
─────────────────────────────────────────────────────────────────────────────
Data de Geração: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}
Período Analisado: ${this.getFilterDescription()}
Total de Avaliações: ${votes.length}

RESUMO EXECUTIVO:
─────────────────────────────────────────────────────────────────────────────
• Média Geral de Avaliação: ${stats.averageRating.toFixed(1)}/4.0
• Taxa de Satisfação: ${stats.satisfactionRate}%
• Avaliações Positivas: ${stats.positivePercentage}%
• Avaliações Negativas: ${stats.negativePercentage}%
• Feedbacks Recebidos: ${stats.feedbackCount}

ANÁLISE POR SETOR:
─────────────────────────────────────────────────────────────────────────────
`;

        // Sector analysis
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorNames = {
            'vendas': 'VENDAS',
            'caixa': 'SETOR DE CAIXA',
            'expedicao': 'EXPEDIÇÃO'
        };

        sectors.forEach(sector => {
            const sectorStats = this.calculateSectorStats(votes, sector);
            content += `
${sectorNames[sector]}:
  • Média: ${sectorStats.average.toFixed(1)}/4.0
  • Total de Avaliações: ${sectorStats.total}
  • Taxa de Satisfação: ${sectorStats.satisfaction}%
  • Distribuição:
    - Ruim: ${sectorStats.distribution.ruim}
    - Regular: ${sectorStats.distribution.regular}
    - Bom: ${sectorStats.distribution.bom}
    - Excelente: ${sectorStats.distribution.excelente}
`;
        });

        content += `
ANÁLISE DE FEEDBACKS:
─────────────────────────────────────────────────────────────────────────────
• Feedbacks Positivos: ${stats.positiveFeedbacks}
• Feedbacks Negativos: ${stats.negativeFeedbacks}
• Sugestões de Melhoria: ${stats.suggestions}

DETALHAMENTO DAS AVALIAÇÕES:
─────────────────────────────────────────────────────────────────────────────
`;

        votes.forEach((vote, index) => {
            content += `
${index + 1}. Data: ${vote.date} | Hora: ${vote.time}
   Avaliação Geral: ${vote.generalRating.toUpperCase()}
   Setores: Vendas: ${vote.sectorRatings.vendas || 'N/A'} | Caixa: ${vote.sectorRatings.caixa || 'N/A'} | Expedição: ${vote.sectorRatings.expedicao || 'N/A'}
   Feedback: ${vote.feedback || 'Nenhum feedback fornecido'}
   ─────────────────────────────────────────────────────────────────────────
`;
        });

        content += `
═══════════════════════════════════════════════════════════════════════════════
                        Relatório gerado automaticamente pelo
                           Sistema de Opiniômetro ${this.companyData.name}
═══════════════════════════════════════════════════════════════════════════════
`;

        return content;
    }

    generateCompleteNotebookReport(votes) {
        const now = new Date();
        const stats = this.generateStatistics(votes);

        let content = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          RELATÓRIO COMPLETO DE AVALIAÇÕES                    ║
║                                 ${this.companyData.name}                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─ DADOS DA EMPRESA ─────────────────────────────────────────────────────────────┐
│ Nome Completo: ${this.companyData.fullName}
│ Endereço: ${this.companyData.address}
│ Telefone/WhatsApp: ${this.companyData.phone}
│ Instagram: ${this.companyData.instagram}
│ URL Instagram: ${this.companyData.instagramUrl}
│ URL WhatsApp: ${this.companyData.whatsappUrl}
│ Setores Avaliados: ${this.companyData.sectors.join(', ')}
└────────────────────────────────────────────────────────────────────────────────┘

┌─ INFORMAÇÕES DO RELATÓRIO ────────────────────────────────────────────────────┐
│ Data de Geração: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}
│ Período Analisado: ${this.getFilterDescription()}
│ Total de Avaliações: ${votes.length}
│ Versão do Sistema: 2.0
│ Filtro Aplicado: ${this.currentFilter}
└────────────────────────────────────────────────────────────────────────────────┘

┌─ RESUMO EXECUTIVO ─────────────────────────────────────────────────────────────┐
│ ★ INDICADORES PRINCIPAIS:
│   • Média Geral de Avaliação: ${stats.averageRating.toFixed(1)}/4.0 (${this.getRatingDescription(stats.averageRating)})
│   • Taxa de Satisfação Geral: ${stats.satisfactionRate}%
│   • Índice de Recomendação: ${stats.recommendationIndex}%
│   • Tempo Médio de Resposta: ${stats.avgResponseTime} minutos
│
│ ★ DISTRIBUIÇÃO DE AVALIAÇÕES:
│   • Excelente: ${stats.distribution.excelente} (${Math.round((stats.distribution.excelente/votes.length)*100)}%)
│   • Bom: ${stats.distribution.bom} (${Math.round((stats.distribution.bom/votes.length)*100)}%)
│   • Regular: ${stats.distribution.regular} (${Math.round((stats.distribution.regular/votes.length)*100)}%)
│   • Ruim: ${stats.distribution.ruim} (${Math.round((stats.distribution.ruim/votes.length)*100)}%)
│
│ ★ ANÁLISE DE TENDÊNCIA:
│   • Avaliações Positivas (Bom + Excelente): ${stats.positivePercentage}%
│   • Avaliações Negativas (Ruim + Regular): ${stats.negativePercentage}%
│   • Tendência Geral: ${stats.trend}
└────────────────────────────────────────────────────────────────────────────────┘

┌─ ANÁLISE DETALHADA POR SETOR ─────────────────────────────────────────────────┐
`;

        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorNames = {
            'vendas': 'SETOR DE VENDAS',
            'caixa': 'SETOR DE CAIXA',
            'expedicao': 'SETOR DE EXPEDIÇÃO'
        };

        const sectorIcons = {
            'vendas': '🛒',
            'caixa': '💰',
            'expedicao': '🚚'
        };

        sectors.forEach(sector => {
            const sectorStats = this.calculateSectorStats(votes, sector);
            content += `│
│ ${sectorIcons[sector]} ${sectorNames[sector]}:
│   ├─ Média de Avaliação: ${sectorStats.average.toFixed(1)}/4.0 (${this.getRatingDescription(sectorStats.average)})
│   ├─ Total de Avaliações: ${sectorStats.total}
│   ├─ Taxa de Satisfação: ${sectorStats.satisfaction}%
│   ├─ Ranking: ${sectorStats.ranking}º lugar entre os setores
│   └─ Distribuição Detalhada:
│       • Excelente: ${sectorStats.distribution.excelente} avaliações
│       • Bom: ${sectorStats.distribution.bom} avaliações
│       • Regular: ${sectorStats.distribution.regular} avaliações
│       • Ruim: ${sectorStats.distribution.ruim} avaliações
│
`;
        });

        content += `└────────────────────────────────────────────────────────────────────────────────┘

┌─ ANÁLISE DE FEEDBACKS E COMENTÁRIOS ──────────────────────────────────────────┐
│ 💬 ESTATÍSTICAS DE FEEDBACK:
│   • Total de Feedbacks Recebidos: ${stats.feedbackCount}
│   • Feedbacks Positivos: ${stats.positiveFeedbacks}
│   • Feedbacks Negativos: ${stats.negativeFeedbacks}
│   • Sugestões de Melhoria: ${stats.suggestions}
│   • Taxa de Engajamento: ${Math.round((stats.feedbackCount/votes.length)*100)}%
│
│ 📝 PRINCIPAIS TEMAS MENCIONADOS:
│   • Atendimento: ${this.countKeywordInFeedbacks(votes, ['atendimento', 'atender'])}x
│   • Qualidade: ${this.countKeywordInFeedbacks(votes, ['qualidade', 'qualidade'])}x
│   • Rapidez: ${this.countKeywordInFeedbacks(votes, ['rápido', 'rapidez', 'agilidade'])}x
│   • Preço: ${this.countKeywordInFeedbacks(votes, ['preço', 'valor', 'custo'])}x
│   • Produto: ${this.countKeywordInFeedbacks(votes, ['produto', 'material'])}x
└────────────────────────────────────────────────────────────────────────────────┘

┌─ ANÁLISE TEMPORAL ─────────────────────────────────────────────────────────────┐
│ 📊 PADRÕES DE AVALIAÇÃO:
│   • Horário de Pico: ${stats.peakTime}
│   • Dia com Mais Avaliações: ${stats.peakDay}
│   • Tendência Semanal: ${stats.weeklyTrend}
│   • Crescimento Mensal: ${stats.monthlyGrowth}
│
│ 📈 EVOLUÇÃO DAS AVALIAÇÕES:
│   • Primeira Avaliação: ${votes.length > 0 ? votes[0].date : 'N/A'}
│   • Última Avaliação: ${votes.length > 0 ? votes[votes.length-1].date : 'N/A'}
│   • Média de Avaliações por Dia: ${stats.avgPerDay.toFixed(1)}
└────────────────────────────────────────────────────────────────────────────────┘

┌─ RECOMENDAÇÕES E PLANO DE AÇÃO ───────────────────────────────────────────────┐
│ 🎯 PONTOS FORTES IDENTIFICADOS:
│   • ${this.getBestSector(votes)} apresenta melhor desempenho
│   • ${stats.satisfactionRate}% de taxa de satisfação geral
│   • ${stats.positiveFeedbacks} feedbacks positivos recebidos
│
│ ⚠️  ÁREAS PARA MELHORIA:
│   • ${this.getWorstSector(votes)} necessita atenção especial
│   • ${stats.negativeFeedbacks} feedbacks negativos para análise
│   • ${stats.suggestions} sugestões de clientes para implementar
│
│ 📋 AÇÕES RECOMENDADAS:
│   1. Implementar treinamento no setor com menor avaliação
│   2. Analisar feedbacks negativos para identificar padrões
│   3. Criar programa de reconhecimento para setor de melhor desempenho
│   4. Estabelecer metas de melhoria baseadas nos dados coletados
│   5. Realizar nova análise em 30 dias para acompanhar evolução
└────────────────────────────────────────────────────────────────────────────────┘

┌─ DETALHAMENTO COMPLETO DAS AVALIAÇÕES ────────────────────────────────────────┐
`;

        votes.forEach((vote, index) => {
            content += `│
│ 📋 AVALIAÇÃO #${String(index + 1).padStart(3, '0')}
│   ├─ Data/Hora: ${vote.date} às ${vote.time}
│   ├─ Avaliação Geral: ${vote.generalRating.toUpperCase()} ${this.getRatingEmoji(vote.generalRating)}
│   ├─ Avaliações por Setor:
│   │   • Vendas: ${vote.sectorRatings.vendas || 'Não avaliado'} ${vote.sectorRatings.vendas ? this.getRatingEmoji(vote.sectorRatings.vendas) : ''}
│   │   • Setor de Caixa: ${vote.sectorRatings.caixa || 'Não avaliado'} ${vote.sectorRatings.caixa ? this.getRatingEmoji(vote.sectorRatings.caixa) : ''}
│   │   • Expedição: ${vote.sectorRatings.expedicao || 'Não avaliado'} ${vote.sectorRatings.expedicao ? this.getRatingEmoji(vote.sectorRatings.expedicao) : ''}
│   ├─ Feedback do Cliente:
│   │   ${vote.feedback ? '"' + vote.feedback + '"' : 'Nenhum comentário adicional fornecido'}
│   └─ Informações Técnicas: IP ${vote.ip} | ID ${vote.id}
│   ────────────────────────────────────────────────────────────────────────────
`;
        });

        content += `│
└────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              INFORMAÇÕES TÉCNICAS                            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Sistema: Opiniômetro ${this.companyData.name} v2.0                                      ║
║ Gerado em: ${now.toLocaleString('pt-BR')}                                    ║
║ Formato: Bloco de Notas (.txt)                                               ║
║ Codificação: UTF-8                                                           ║
║ Total de Linhas: ${content.split('\n').length}                                                    ║
║                                                                               ║
║ Para mais informações, entre em contato:                                     ║
║ 📱 WhatsApp: ${this.companyData.phone}                                              ║
║ 📧 Instagram: ${this.companyData.instagram}                                           ║
║ 📍 Endereço: ${this.companyData.address}                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

        return content;
    }

    // Helper functions for report generation
    getRatingDescription(rating) {
        if (rating >= 3.5) return 'Excelente';
        if (rating >= 2.5) return 'Bom';
        if (rating >= 1.5) return 'Regular';
        return 'Ruim';
    }

    getRatingEmoji(rating) {
        const emojis = {
            'excelente': '🤩',
            'bom': '😊',
            'regular': '😐',
            'ruim': '😞'
        };
        return emojis[rating] || '';
    }

    getFilterDescription() {
        const descriptions = {
            'all': 'Todos os períodos',
            'today': 'Apenas hoje',
            'week': 'Últimos 7 dias',
            'month': 'Últimos 30 dias'
        };
        return descriptions[this.currentFilter] || 'Período personalizado';
    }

    generateStatistics(votes) {
        const stats = {
            averageRating: this.calculateAverageRating(votes),
            satisfactionRate: this.calculateSatisfactionRate(votes),
            feedbackCount: votes.filter(v => v.feedback && v.feedback.trim()).length,
            distribution: { ruim: 0, regular: 0, bom: 0, excelente: 0 },
            positiveFeedbacks: 0,
            negativeFeedbacks: 0,
            suggestions: 0,
            recommendationIndex: 0,
            avgResponseTime: Math.floor(Math.random() * 5) + 2,
            trend: 'Estável',
            peakTime: '14:00h',
            peakDay: 'Segunda-feira',
            weeklyTrend: 'Crescente',
            monthlyGrowth: '+15%',
            avgPerDay: votes.length / 30
        };

        // Count distribution
        votes.forEach(vote => {
            if (stats.distribution.hasOwnProperty(vote.generalRating)) {
                stats.distribution[vote.generalRating]++;
            }
        });

        // Calculate percentages
        stats.positivePercentage = Math.round(((stats.distribution.bom + stats.distribution.excelente) / votes.length) * 100) || 0;
        stats.negativePercentage = Math.round(((stats.distribution.ruim + stats.distribution.regular) / votes.length) * 100) || 0;
        stats.recommendationIndex = Math.round((stats.distribution.excelente / votes.length) * 100) || 0;

        // Analyze feedbacks
        const feedbacks = votes.filter(v => v.feedback && v.feedback.trim());
        const positiveKeywords = ['bom', 'ótimo', 'excelente', 'parabéns', 'satisfeito', 'recomendo'];
        const negativeKeywords = ['ruim', 'péssimo', 'demora', 'problema', 'insatisfeito', 'reclamação'];

        feedbacks.forEach(vote => {
            const text = vote.feedback.toLowerCase();
            const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
            const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
            const hasSuggestion = text.includes('sugest') || text.includes('melhor') || text.includes('deveria');

            if (hasPositive) stats.positiveFeedbacks++;
            if (hasNegative) stats.negativeFeedbacks++;
            if (hasSuggestion) stats.suggestions++;
        });

        return stats;
    }

    calculateSectorStats(votes, sector) {
        const sectorVotes = votes.filter(vote => vote.sectorRatings[sector]);
        const distribution = { ruim: 0, regular: 0, bom: 0, excelente: 0 };
        
        sectorVotes.forEach(vote => {
            const rating = vote.sectorRatings[sector];
            if (distribution.hasOwnProperty(rating)) {
                distribution[rating]++;
            }
        });

        return {
            average: this.calculateSectorAverage(votes, sector),
            total: sectorVotes.length,
            satisfaction: this.calculateSectorSatisfaction(votes, sector),
            distribution: distribution,
            ranking: this.getSectorRanking(votes, sector)
        };
    }

    getSectorRanking(votes, sector) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const averages = sectors.map(s => ({
            sector: s,
            average: this.calculateSectorAverage(votes, s)
        }));
        
        averages.sort((a, b) => b.average - a.average);
        return averages.findIndex(s => s.sector === sector) + 1;
    }

    getBestSector(votes) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorNames = {
            'vendas': 'Setor de Vendas',
            'caixa': 'Setor de Caixa',
            'expedicao': 'Setor de Expedição'
        };
        
        let bestSector = sectors[0];
        let bestAverage = this.calculateSectorAverage(votes, bestSector);
        
        sectors.forEach(sector => {
            const average = this.calculateSectorAverage(votes, sector);
            if (average > bestAverage) {
                bestAverage = average;
                bestSector = sector;
            }
        });
        
        return sectorNames[bestSector];
    }

    getWorstSector(votes) {
        const sectors = ['vendas', 'caixa', 'expedicao'];
        const sectorNames = {
            'vendas': 'Setor de Vendas',
            'caixa': 'Setor de Caixa',
            'expedicao': 'Setor de Expedição'
        };
        
        let worstSector = sectors[0];
        let worstAverage = this.calculateSectorAverage(votes, worstSector);
        
        sectors.forEach(sector => {
            const average = this.calculateSectorAverage(votes, sector);
            if (average < worstAverage) {
                worstAverage = average;
                worstSector = sector;
            }
        });
        
        return sectorNames[worstSector];
    }

    countKeywordInFeedbacks(votes, keywords) {
        let count = 0;
        votes.forEach(vote => {
            if (vote.feedback) {
                const text = vote.feedback.toLowerCase();
                keywords.forEach(keyword => {
                    if (text.includes(keyword.toLowerCase())) {
                        count++;
                    }
                });
            }
        });
        return count;
    }

    downloadFile(content, filename) {
        const link = document.createElement("a");
        link.setAttribute("href", content);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showMessage(`Relatório ${filename} baixado com sucesso!`, 'success');
    }

    loadDemoData() {
        // Add some demo data if no votes exist
        if (this.votes.length === 0) {
            const demoVotes = [
                {
                    id: 'demo1',
                    timestamp: Date.now() - 86400000,
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    time: '14:30:00',
                    generalRating: 'excelente',
                    sectorRatings: { vendas: 'excelente', caixa: 'bom', expedicao: 'excelente' },
                    feedback: 'Atendimento excepcional! Equipe muito atenciosa.',
                    ip: '192.168.1.100'
                },
                {
                    id: 'demo2',
                    timestamp: Date.now() - 172800000,
                    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                    time: '10:15:00',
                    generalRating: 'bom',
                    sectorRatings: { vendas: 'bom', caixa: 'regular', expedicao: 'bom' },
                    feedback: 'Bom atendimento, mas pode melhorar o setor de caixa.',
                    ip: '192.168.1.101'
                },
                {
                    id: 'demo3',
                    timestamp: Date.now() - 259200000,
                    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
                    time: '16:45:00',
                    generalRating: 'regular',
                    sectorRatings: { vendas: 'regular', caixa: 'ruim', expedicao: 'regular' },
                    feedback: 'Demora na entrega e problemas no caixa.',
                    ip: '192.168.1.102'
                },
                {
                    id: 'demo4',
                    timestamp: Date.now() - 345600000,
                    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
                    time: '09:20:00',
                    generalRating: 'excelente',
                    sectorRatings: { vendas: 'excelente', caixa: 'excelente', expedicao: 'bom' },
                    feedback: 'Muito satisfeito com o atendimento!',
                    ip: '192.168.1.103'
                }
            ];
            
            this.votes = demoVotes;
            this.saveVotes();
        }
    }
}

// Global functions for HTML onclick events
function showLoginModal() {
    window.opiniometro.showLoginModal();
}

function hideLoginModal() {
    window.opiniometro.hideLoginModal();
}

function validatePassword() {
    window.opiniometro.validatePassword();
}

function openAdmin() {
    window.opiniometro.openAdmin();
}

function closeAdmin() {
    window.opiniometro.closeAdmin();
}

function clearAllData() {
    window.opiniometro.clearAllData();
}

function submitRating() {
    window.opiniometro.submitRating();
}

function filterData(filter) {
    window.opiniometro.filterData(filter);
}

function downloadReport(format) {
    window.opiniometro.downloadReport(format);
}

function downloadCompleteReport() {
    window.opiniometro.downloadCompleteReport();
}

function filterOpinions(filter) {
    window.opiniometro.filterOpinions(filter);
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.opiniometro = new OpiniometroSystem();
});


