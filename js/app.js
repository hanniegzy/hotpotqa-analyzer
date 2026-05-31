

const API_URL = 'http://192.168.199.157:5000/api';

// 导航
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        if (section === 'dashboard') loadDashboard();
        if (section === 'visualization') loadVisualization();
    });
});

// 加载仪表板
async function loadDashboard() {
    try {
        const res = await axios.get(`${API_URL}/stats`);
        const stats = res.data;
        
        document.getElementById('totalQuestions').textContent = stats.totalQuestions.toLocaleString();
        document.getElementById('avgHops').textContent = (stats.supportingFactsStats.avgFacts || 0).toFixed(2);
        
        const bridge = stats.typeDistribution.find(t => t._id === 'bridge')?.count || 0;
        const comparison = stats.typeDistribution.find(t => t._id === 'comparison')?.count || 0;
        
        document.getElementById('typeBridge').textContent = bridge.toLocaleString();
        document.getElementById('typeComparison').textContent = comparison.toLocaleString();
        
        drawTypeChart(stats.typeDistribution);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 绘制类型图表
function drawTypeChart(data) {
    const svg = d3.select('#typeChart');
    const width = svg.node().getBoundingClientRect().width;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 20, left: 60 };
    
    svg.selectAll('*').remove();
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const x = d3.scaleBand().domain(data.map(d => d._id)).range([0, plotWidth]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([plotHeight, 0]);
    
    g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d._id))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => plotHeight - y(d.count))
        .attr('fill', '#3498db');
    
    g.selectAll('text')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d._id) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#2c3e50')
        .text(d => d.count.toLocaleString());
    
    g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y));
}

// 搜索功能
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchQuery').value;
    const type = document.getElementById('typeFilter').value;
    
    try {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (type) params.append('type', type);
        
        const res = await axios.get(`${API_URL}/search?${params}`);
        displayResults(res.data.data);
    } catch (error) {
        console.error('Search error:', error);
    }
});

function displayResults(results) {
    let html = '<table class="results-table"><thead><tr><th>问题</th><th>答案</th><th>类型</th><th>跳数</th></tr></thead><tbody>';
    
    results.forEach(r => {
        html += `<tr>
            <td>${r.question.substring(0, 50)}...</td>
            <td>${r.answer}</td>
            <td>${r.type}</td>
            <td>${r.supporting_facts.length}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('searchResults').innerHTML = html;
}

// 加载可视化
async function loadVisualization() {
    try {
        const [answerRes, factsRes] = await Promise.all([
            axios.get(`${API_URL}/viz/answer-length`),
            axios.get(`${API_URL}/viz/supporting-facts`)
        ]);
        
        drawAnswerChart(answerRes.data.answerLengthDistribution);
        drawFactsChart(factsRes.data.supportingFactsDistribution);
    } catch (error) {
        console.error('Error:', error);
    }
}

function drawAnswerChart(data) {
    const svg = d3.select('#answerChart');
    const width = svg.node().getBoundingClientRect().width;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const x = d3.scaleBand().domain(data.map((d,i) => i)).range([0, plotWidth]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([plotHeight, 0]);
    
    g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d,i) => x(i))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => plotHeight - y(d.count))
        .attr('fill', '#27ae60');
    
    g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y));
}

function drawFactsChart(data) {
    const svg = d3.select('#factsChart');
    const width = svg.node().getBoundingClientRect().width;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const x = d3.scaleBand().domain(data.map(d => d._id)).range([0, plotWidth]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([plotHeight, 0]);
    
    g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d._id))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => plotHeight - y(d.count))
        .attr('fill', '#e74c3c');
    
    g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x));
    g.append('g').call(d3.axisLeft(y));
}

// 聚类
document.getElementById('clusterBtn').addEventListener('click', async () => {
    try {
        const res = await axios.get(`${API_URL}/clustering`);
        let html = '';
        res.data.clusters.forEach(c => {
            html += `<div class="cluster-card">
                <h4>${c._id.type} - ${c._id.hops} 跳</h4>
                <p class="count">${c.count} 个问题</p>
            </div>`;
        });
        document.getElementById('clusterResults').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
});

// 初始加载
loadDashboard();
EOF
