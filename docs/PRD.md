# Product Requirements Document: AI-Powered Call Transcript Intelligence

**Version**: 1.0  
**Last Updated**: February 15, 2026  
**Owner**: Dipti Garg 
**Status**: In Development

---

## 1. Executive Summary

An AI-powered MCP server that enables business stakeholders to extract insights from client call transcripts using natural language queries. Fully open-source, runs locally with zero API costs.

**Key Value Props**:
- 🔍 Natural language search over call transcripts
- 📊 Structured summaries with action items & decisions
- 🔒 100% local processing (privacy-first)
- 💰 Zero ongoing costs (no cloud APIs)
- ⚡ Automatic indexing on file addition

---

## 2. Problem Statement

### Current Pain Points
1. **Manual Review Burden**: Teams spend hours reviewing call recordings/transcripts
2. **Lost Insights**: Key decisions, action items, and risks get buried in long transcripts
3. **No Search**: Can't quickly find "What did we discuss about pricing with Acme?"
4. **Privacy Concerns**: Uploading sensitive client calls to cloud services
5. **High Costs**: OpenAI/cloud LLM services cost $100-500/month for regular usage

### Target Users
- **Primary**: Account Managers, Customer Success Managers, Sales Teams
- **Secondary**: Product Managers, Support Leads, Executives
- **Company Size**: 10-1000 employees with regular client calls

---

## 3. Goals & Success Metrics

### Business Goals
- Enable instant recall of call insights
- Reduce call review time by 80%
- Improve follow-up action completion by 40%

### Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Response Time | < 5 seconds | P95 latency |
| Summary Accuracy | > 85% | Manual validation sample |
| Adoption Rate | > 60% of target users | Weekly active users |
| Time Saved | 5+ hours/week per user | User survey |
| Cost | $0/month | vs. cloud alternatives |

---

## 4. Core Use Cases

### UC1: Post-Call Summary
**Actor**: Account Manager  
**Goal**: Get structured summary of call within minutes  
**Flow**:
1. Call recording auto-transcribed to VTT
2. VTT file saved to monitored folder
3. System auto-generates structured summary (2-3 min)
4. User asks: "Summarize my Capital One call"
5. Receives: Call type, participants, topics, action items, decisions

### UC2: Historical Search
**Actor**: Sales Manager  
**Goal**: Find what was discussed about pricing across all calls  
**Flow**: *(Future - Multi-transcript search)*
1. User asks: "What pricing concerns came up in Q1 sales calls?"
2. System searches all indexed summaries
3. Returns aggregated insights with source citations

### UC3: Action Item Tracking
**Actor**: CSM  
**Goal**: Never miss follow-up commitments  
**Flow**:
1. User asks: "What are my action items from the Acme call?"
2. System returns structured list of action items
3. User tracks in their PM tool

---

## 5. Requirements

### 5.1 Functional Requirements

#### Must Have (V1)
- ✅ **FR1**: Automatic indexing of VTT files on folder watch
- ✅ **FR2**: Generate structured summaries (Call Type, Participants, Companies, Summary, Key Topics, Action Items, Decisions)
- ✅ **FR3**: Natural language query interface via Claude Desktop/MCP
- ✅ **FR4**: Single-transcript semantic search
- ✅ **FR5**: Local LLM (Ollama) for summary generation
- ✅ **FR6**: Local embeddings (no cloud APIs)

#### Should Have (V2)
- 🔄 **FR7**: Multi-transcript aggregation queries
- 🔄 **FR8**: Date range filtering ("calls in last month")
- 🔄 **FR9**: Export summaries to Notion/Confluence
- 🔄 **FR10**: Email digest of daily summaries

#### Nice to Have (V3)
- 💡 **FR11**: Sentiment analysis per call
- 💡 **FR12**: Risk flagging (e.g., "customer mentioned churn")
- 💡 **FR13**: Follow-up reminder integration
- 💡 **FR14**: Web UI (in addition to MCP)

### 5.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| **NFR1** | Summary generation latency | < 3 min per call |
| **NFR2** | Query response time | < 5 sec |
| **NFR3** | System uptime | > 99% |
| **NFR4** | Data privacy | 100% local processing |
| **NFR5** | Resource usage | < 8GB RAM, 10GB disk |
| **NFR6** | Supported transcript length | Up to 2 hours (30K words) |

---

## 6. Key Decision Points

### 6.1 Architecture Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| **LLM Provider** | OpenAI, Anthropic, Ollama | **Ollama (Phi-3)** | Zero cost, privacy, offline capability |
| **Embedding Model** | OpenAI, Cohere, Local | **Local (HuggingFace)** | Zero cost, consistent with privacy-first |
| **Vector DB** | Pinecone, Weaviate, Chroma | **Chroma (local)** | Simple, lightweight, no server needed |
| **Indexing Strategy** | Chunk-based, Summary-based | **Summary-based** | Better UX for single-call queries |
| **MCP Transport** | HTTP, stdio | **stdio** | Simpler for desktop integration |

### 6.2 Product Decisions

| Decision | Trade-off | Impact |
|----------|-----------|--------|
| **Local-first architecture** | More setup complexity vs. zero cost + privacy | ✅ Privacy-first positioning, enterprise appeal |
| **Single tool (no routing)** | Can't handle multi-transcript queries yet vs. simpler UX | ✅ Ship faster, iterate based on usage |
| **Phi-3 over GPT-4** | Slightly lower quality vs. free + fast | ✅ Good enough for structured summaries |
| **VTT format only** | Limits input options vs. simplicity | ✅ Can add converters later |

### 6.3 Trade-offs Analysis

**✅ Wins**:
- Zero marginal cost per query
- Complete data privacy
- Works offline
- Fast for single-call queries

**⚠️ Challenges**:
- Initial setup requires 3 services (Node, Chroma, Ollama)
- Multi-transcript queries not yet supported
- Requires 8GB RAM (may limit some users)
- Summary quality depends on local model

---

## 7. Future Enhancements

### Phase 2: Multi-Transcript Intelligence (Q2 2026)
**Goal**: Answer questions across multiple calls

**Features**:
- 🎯 Aggregate queries ("All action items from Q1")
- 🎯 Trend analysis ("Most discussed topics this month")
- 🎯 Cross-call insights ("How has pricing discussion evolved?")
- 🎯 Filter by date range, client, call type

**Technical Approach**:
- Dual-index: Keep summary collection + add chunk collection
- Query router: Detect single vs. multi-transcript intent
- Aggregation layer: Combine results from multiple summaries

**Success Metrics**:
- 80% of queries answered without looking up original call
- 90% user satisfaction with aggregated insights

---

### Phase 3: Proactive Insights (Q3 2026)
**Goal**: Surface insights without explicit queries

**Features**:
- 📧 Daily/weekly email digest of key insights
- 🚨 Automatic risk flagging (churn signals, competitor mentions)
- 📊 Dashboard with trends (sentiment over time, topic frequency)
- 🔔 Action item reminders
- 💬 Slack/Teams integration

**Success Metrics**:
- 50%+ of users enable proactive insights
- 30%+ improvement in action item completion

---

### Phase 4: Enterprise Features (Q4 2026)
**Goal**: Scale to large organizations

**Features**:
- 👥 Multi-user support (team-wide knowledge base)
- 🔐 Role-based access control (sales can't see support calls)
- 🔄 CRM integration (Salesforce, HubSpot sync)
- 📈 Analytics dashboard for leadership
- 🌐 Multi-language support
- ☁️ Optional cloud deployment (for teams without local resources)

**Success Metrics**:
- Support teams of 50+ users
- < 1 hour onboarding for new team members

---

### Phase 5: Advanced AI Capabilities (2027)
**Goal**: Move beyond summaries to actionable intelligence

**Features**:
- 🤖 Next-best-action recommendations
- 📝 Auto-draft follow-up emails based on call
- 🎯 Deal health scoring from call sentiment
- 🔮 Predictive insights (likely to churn, upsell opportunity)
- 🧠 Learning from outcomes (which actions led to wins?)

---

## 8. Technical Architecture (Simplified)

```
┌─────────────────┐
│  Claude Desktop │ (User Interface)
└────────┬────────┘
         │ stdio MCP
┌────────▼──────────────────────────────────┐
│          MCP Server (Node.js)              │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Query   │  │ Indexer  │  │ Watcher │ │
│  │   Tool   │  │          │  │         │ │
│  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼────────────┼────────────┼────────┘
        │            │            │
   ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
   │ Vector  │  │ Ollama │  │  VTT   │
   │   DB    │  │  LLM   │  │ Files  │
   │(Chroma) │  │(Phi-3) │  │        │
   └─────────┘  └────────┘  └────────┘
```

**Key Components**:
- **MCP Server**: Orchestration, query routing
- **Ollama**: Local LLM (Phi-3/Llama3) for summaries
- **ChromaDB**: Vector storage & semantic search
- **File Watcher**: Auto-detect new transcripts
- **Embedding Service**: Local embeddings (HuggingFace)

---

## 9. Go-to-Market Strategy

### Target Segments
1. **Early Adopters**: Tech-savvy sales/CS teams (50-200 employees)
2. **Privacy-Conscious**: Healthcare, financial services, legal
3. **Cost-Optimizers**: Startups looking to reduce SaaS spend

### Distribution Channels
- GitHub/Open Source (primary)
- Claude Desktop MCP marketplace
- Product Hunt launch
- LinkedIn/Twitter thought leadership

### Pricing Strategy
- **Open Source**: Free forever (community support)
- **Pro Support** (Future): $50/user/month (priority support, managed deployment)
- **Enterprise** (Future): Custom (SSO, audit logs, SLA)

---

## 10. Launch Plan

### V1.0 Launch (Current)
**Target**: March 2026  
**Audience**: Open source community, early adopters  
**Goals**:
- ✅ 100 GitHub stars in first month
- ✅ 20 active installations
- ✅ 5 pieces of user feedback

**Launch Activities**:
- GitHub repository release
- Demo video (3 min)
- Documentation complete
- Blog post on local-first AI

### V1.5 (Multi-Transcript) Launch
**Target**: Q2 2026  
**Audience**: Expanding to larger teams  
**Goals**: 200 active installations, 10 GitHub contributors

### V2.0 (Enterprise) Launch
**Target**: Q4 2026  
**Audience**: Mid-market companies (100-500 employees)  
**Goals**: 5 paying customers, $10K MRR

---

## 11. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Ollama setup too complex** | High | Medium | Create one-click installer, improve docs |
| **Summary quality insufficient** | High | Low | Offer model upgrade path (Phi-3 → Llama3), tune prompts |
| **Resource requirements too high** | Medium | Medium | Optimize, support cloud deployment option |
| **Limited adoption due to VTT-only** | Medium | Medium | Add converters for common formats (MP3 → VTT) |
| **ChromaDB instability** | Low | Low | Monitor, have backup DB option (Qdrant) |

---

## 12. Open Questions

1. **Multi-tenant**: How do we support team-wide deployments without compromising local-first?
2. **Real-time**: Should we support live call processing (not just post-call)?
3. **Mobile**: Is there demand for mobile access (iOS/Android)?
4. **Integrations**: Which CRM/PM tools should we prioritize?
5. **Monetization**: What % of users would pay for managed service?

---

## 13. Success Criteria for V1

**Must Achieve**:
- [ ] System runs stable for 30 days without crashes
- [ ] Query latency < 5 seconds (P95)
- [ ] Summary generation < 3 minutes per call
- [ ] User satisfaction > 4/5 (via survey)
- [ ] Zero data privacy incidents

**Nice to Achieve**:
- [ ] 100+ GitHub stars
- [ ] 3+ blog posts/articles written about it
- [ ] 1+ enterprise evaluation started

---

## Appendix

### Related Documents
- [Technical Architecture](architecture.md)
- [Ollama Setup Guide](OLLAMA_SETUP.md)
- [Quick Start Guide](QUICK_START.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

### Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Product Team | Initial PRD |
