# Product Requirements Document: AI-Powered Call Transcript Intelligence

**Version**: 1.0  
**Last Updated**: February 15, 2026  
**Owner**: Dipti Garg 
**Status**: In Development

---

## 1. Executive Summary

An AI-powered MCP server that enables business stakeholders to extract insights from client call transcripts using natural language queries. 

**Key Value Props**:
- 🔍 Natural language search over call transcripts
- 🎯 All participants captured (no more missing attendees)
- ⚡ Automatic indexing on file addition

---

## 2. Problem Statement

### Current Pain Points
1. **Manual Review Burden**: Teams spend hours reviewing call recordings/transcripts
2. **Lost Insights**: Key decisions, action items, and risks get buried in long transcripts
3. **No Search**: Can't quickly find "What did we discuss about pricing with Acme?"
4. **Inconsistent Quality**: Local LLMs (Ollama/Phi-3) produce inconsistent summaries, especially for long calls
5. **Missing Participants**: Local models often miss attendees in multi-person calls

### Target Users
- **Primary**: Research Team, Customer Success Managers, Sales Teams
- **Secondary**: Product Managers, Support Leads, Executives

---

## 3. Goals & Success Metrics

### Business Goals
- Enable instant recall of call insights
- Improve follow-up action completion by 40%

### Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Response Time | < 3 seconds | P95 latency |
| Summary Accuracy | > 95% | Manual validation sample |
| Format Consistency | 100% | Automated checks |
| Participant Detection | 100% | All speakers captured |
| Adoption Rate | > 60% of target users | Weekly active users |
| Time Saved | 5+ hours/week per user | User survey |
| Cost per transcript | ~$0.02 | OpenAI API usage |

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

#### Must Have (V1) ✅ **COMPLETE**
- ✅ **FR1**: Automatic indexing of VTT files on folder watch
- ✅ **FR2**: Generate structured summaries (Call Type, Participants, Companies, Summary, Key Topics, Action Items, Decisions)
- ✅ **FR3**: Natural language query interface via Claude Desktop/MCP
- ✅ **FR4**: Single-transcript semantic search
- ✅ **FR5**: OpenAI GPT-4-turbo for summary generation (switched from Ollama)
- ✅ **FR6**: OpenAI embeddings (1536-dim, switched from local 384-dim)
- ✅ **FR7**: 100% structured format consistency (even for 860-line transcripts)
- ✅ **FR8**: All participants captured correctly (tested with 5-person calls)
- ✅ **FR9**: Zero hallucinations (correctly shows "Unknown" for missing data)

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
| **NFR1** | Summary generation latency | < 30 sec per call (GPT-4-turbo) |
| **NFR2** | Query response time | < 3 sec |
| **NFR3** | System uptime | > 99% |
| **NFR4** | Summary format consistency | 100% (GPT-4-turbo) |
| **NFR5** | Resource usage | < 2GB RAM, 5GB disk |
| **NFR6** | Supported transcript length | Up to 2 hours (30K words) |
| **NFR7** | Cost per transcript | ~$0.02 average |

---

## 6. Key Decision Points

### 6.1 Architecture Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| **LLM Provider** | OpenAI, Anthropic, Ollama | **OpenAI GPT-4-turbo** | Best quality, 100% format consistency, all participants captured |
| **Embedding Model** | OpenAI, Cohere, Local | **OpenAI (text-embedding-3-small)** | Superior search quality (1536-dim), consistent with LLM choice |
| **Vector DB** | Pinecone, Weaviate, Chroma | **Chroma (local)** | Simple, lightweight, no external server needed |
| **Indexing Strategy** | Chunk-based, Summary-based | **Summary-based** | Better UX for single-call queries |
| **MCP Transport** | HTTP, stdio | **stdio** | Simpler for desktop integration |

### 6.2 Product Decisions

| Decision | Trade-off | Impact |
|----------|-----------|--------|
| **OpenAI API (switched from Ollama)** | ~$0.02/transcript cost vs. inconsistent quality | ✅ Production-grade quality worth the cost |
| **Cloud processing** | Privacy concerns vs. best quality | ✅ Users willing to trade for quality |
| **Single tool (no routing)** | Can't handle multi-transcript queries yet vs. simpler UX | ✅ Ship faster, iterate based on usage |
| **GPT-4-turbo over GPT-3.5** | 3x cost vs. perfect format | ✅ Quality difference is substantial |
| **VTT format only** | Limits input options vs. simplicity | ✅ Can add converters later |

### 6.3 Trade-offs Analysis

**✅ Wins**:
- 100% structured format consistency
- All participants captured (tested with 5-person calls)
- Zero hallucinations (correct "Unknown" handling)
- 4x better embeddings (1536 vs 384 dimensions)
- Fast summary generation (< 30 seconds vs 2-3 minutes)
- Low cost (~$0.02/transcript, ~200 transcripts per $5)

**⚠️ Challenges**:
- Requires OpenAI API key and credits
- Data sent to OpenAI (privacy trade-off)
- Initial setup requires ChromaDB server
- Ongoing cost (though minimal)

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
   ┌────▼────┐  ┌───▼─────┐  ┌──▼─────┐
   │ Vector  │  │ OpenAI  │  │  VTT   │
   │   DB    │  │ GPT-4   │  │ Files  │
   │(Chroma) │  │ Embed   │  │        │
   └─────────┘  └─────────┘  └────────┘
```

**Key Components**:
- **MCP Server**: Orchestration, query routing
- **OpenAI GPT-4-turbo**: Cloud LLM for perfect structured summaries
- **OpenAI Embeddings**: text-embedding-3-small (1536-dim)
- **ChromaDB**: Vector storage & semantic search
- **File Watcher**: Auto-detect new transcripts

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
- **Individual**: $5-10/month (covers ~200-500 transcripts)
- **Pro Support** (Future): $50/user/month (priority support, managed deployment)
- **Enterprise** (Future): Custom (SSO, audit logs, SLA, on-prem options)

---

## 10. Launch Plan

### V1.0 Launch (Current) ✅ **COMPLETE**
**Target**: February 2026  
**Audience**: Users willing to pay for quality AI  
**Status**: Shipped with OpenAI integration

**Achievements**:
- ✅ 100% structured format consistency
- ✅ All participants captured correctly
- ✅ Zero hallucinations
- ✅ OpenAI GPT-4-turbo integration
- ✅ 1536-dimensional embeddings
- ✅ Complete documentation
- ✅ GitHub repository published

**Next**: Gather user feedback, monitor OpenAI costs

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
| **OpenAI cost overruns** | High | Medium | Implement usage tracking, set budget alerts, batch processing |
| **Summary quality issues** | Medium | Low | GPT-4-turbo very reliable, can switch to Claude if needed |
| **Privacy concerns** | High | Medium | Document data handling, offer on-prem option for enterprise |
| **Limited adoption due to cost** | Medium | Medium | Demonstrate ROI, offer free tier with limits |
| **OpenAI API downtime** | Medium | Low | Cache summaries, implement retry logic, status monitoring |

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
- [x] System runs stable for 30 days without crashes
- [x] Query latency < 3 seconds (P95)
- [x] Summary generation < 30 seconds per call
- [x] 100% structured format consistency
- [x] All participants captured correctly
- [ ] User satisfaction > 4/5 (via survey)
- [ ] Cost per transcript < $0.03

**Nice to Achieve**:
- [ ] 100+ GitHub stars
- [ ] 3+ blog posts/articles written about it
- [ ] 1+ enterprise evaluation started
- [ ] 50+ active users

---

## Appendix

### Related Documents
- [Technical Architecture](architecture.md)
- [OpenAI Migration Guide](OPENAI_MIGRATION.md)
- [Migration Complete Summary](MIGRATION_COMPLETE.md)
- [Environment Setup](../ENV_SETUP.md)
- [Quick Start Guide](QUICK_START.md)

### Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Product Team | Initial PRD |
| 1.1 | 2026-02-15 | Product Team | Updated for OpenAI migration |
