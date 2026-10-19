I'm Nikhil Bhagat, an AI/ML engineer and NLP researcher in Biratnagar, Nepal. I build LLM agents, retrieval systems and the evaluation that keeps them honest, mostly for languages that large models still get wrong.

Read more on [my website](https://nikhilbhagat.com.np), find me on [LinkedIn](https://www.linkedin.com/in/bhagatnikhil/), [Hugging Face](https://huggingface.co/Haubaa) and [ORCID](https://orcid.org/0009-0008-9603-8746), or write to [programmer@nikhilbhagat.com.np](mailto:programmer@nikhilbhagat.com.np).

### [1] NLP research

**NEPVERSA**, the first version-aware Nepali statutory retrieval benchmark: 5 Acts, 455 provisions, 99 amendment operations and 181 point-in-time questions. Gold answers come from amendment footnotes, not from an LLM, and 61.3% of questions expect the system to abstain. Under review at ACM TALLIP.

Read the [preprint](https://doi.org/10.5281/zenodo.22916911), or rerun every published number offline from the [code and data](https://github.com/NikeGunn/nyasathi-reserch), with all 455 provisions verified by SHA-256.

### [2] Agents in production

Lead senior AI engineer (contract) at Kribaat, Kathmandu, since 2024. Senior backend engineer for CineArtLink, Hong Kong, since 2022.

- **[Kribaat](https://kribaat.com)**: 24/7 customer-service agents on WhatsApp, Instagram and web chat in Nepali, Romanized Nepali, English and Chinese. A verification gate checks every price, listing and booking code against live tools before a reply is sent.
- **[HisabKitab](https://hisabkitab.pro)**: a WhatsApp accountant for VAT-registered businesses. It reads bills from photos, applies Nepal VAT and TDS in exact integer paisa, and saves nothing until the owner confirms.
- **[NyayaSathi](https://nyaya.kribaat.com)**: legal research for Nepali advocates over 11,587 passages, with zero fabricated citations on an adversarial set.
- **[AgentGuard](https://github.com/NikeGunn/agentguard)**: a zero-trust sidecar that blocks prompt injection, tool poisoning and secret leakage in Claude Code, Cursor, Codex and Gemini CLI, at under 5 ms p99.

### [3] Open source

```text
receipt    repository                     change                                  status
22ddd82    morluto/rea                    repeated-registration ownership         merged, co-author
#11618     Significant-Gravitas/AutoGPT   thread-safe ExecutionQueue              merged
#191       google/sandboxed-api           mount rules for submounts               in review
```

Sources: [rea 22ddd82](https://github.com/morluto/rea/commit/22ddd820143b0ce455756b24acf60ed251286622), [AutoGPT #11618](https://github.com/Significant-Gravitas/AutoGPT/pull/11618) and [sandboxed-api #191](https://github.com/google/sandboxed-api/pull/191).

### Tools I reach for

Python, Go and TypeScript. PyTorch, Hugging Face, QLoRA and GGUF for models; LangChain, LlamaIndex, MCP and the Claude API for agents; FAISS and BM25 for retrieval. Django, FastAPI, PostgreSQL, Redis and NATS behind them, shipped with Docker, Kubernetes, Terraform and GitHub Actions.

<sub>Every claim above links to its source. If one doesn't hold up, open an issue.</sub>
