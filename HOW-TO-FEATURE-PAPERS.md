# How to Feature Papers - User Guide

## ✨ Featured Papers System

The featured papers section allows you to highlight your most important publications. The system now supports **manual control** with automatic fallbacks.

---

## 📋 Priority Order

The system selects featured papers in this order:

1. **Manually Featured** - Papers with `"featured": true`
2. **Award Winners** - Papers with an `"award"` field
3. **Recent Journals** - High-impact journals from 2020+ (automatic backup)

**Maximum**: 10 featured papers total  
**Minimum**: 6 papers (will auto-fill if needed)

---

## 🎯 How to Feature a Paper

### Method 1: Manual Featured Flag (Recommended)

1. Open `/data/publications.json`
2. Find the paper you want to feature
3. Add `"featured": true` to the paper object
4. **Optional**: Add a custom `"featuredReason"` to explain why it's special
5. Save and refresh the page

**Example:**

```json
{
  "id": "jpaper4-2025",
  "type": "journal",
  "title": "Frequency-constrained autonomous microgrid planning for mining industry applications",
  "authors": "Hossein Ranjbar, Hirad Assimi, S. Ali Pourmousavi, Wen L Soong",
  "journal": "Applied Energy",
  "volume": "396:126201",
  "year": 2025,
  "month": "Oct.",
  "doi": "https://www.sciencedirect.com/science/article/pii/S2352152X25018171",
  "pdf": "docs/JPaper3-2025.pdf",
  "featured": true,
  "featuredReason": "Breakthrough methodology for mining microgrid optimization with real-world industry applications"
}
```

### Method 2: Add an Award

Papers with awards are automatically featured (if space available):

```json
{
  "title": "Your Paper Title",
  "authors": "...",
  "year": 2024,
  "type": "journal",
  "journal": "IEEE Transactions...",
  "award": "Best Paper Award",
  "doi": "...",
  "pdf": "..."
}
```

---

## 🔧 Custom Featured Reasons

You can provide a custom explanation for why a paper is featured:

```json
{
  "title": "Your Paper",
  "featured": true,
  "featuredReason": "This paper introduced the novel XYZ framework adopted by 50+ institutions worldwide"
}
```

If you don't provide `featuredReason`, the system generates one automatically:
- **Manual + Award**: "Featured research: [Award Name]"
- **Manual only**: "Selected as a key contribution to the field"
- **Award only**: "Award-winning research: [Award Name]"
- **Auto-selected journal**: "High-impact journal publication with significant citations"

---

## 📝 Step-by-Step Example

### To feature your Applied Energy 2025 paper:

1. Open `data/publications.json`
2. Find this entry (around line 12):
   ```json
   {
     "id": "jpaper4-2025",
     "type": "journal",
     "title": "Frequency-constrained autonomous microgrid planning for mining industry applications",
     ...
   ```

3. Add these two lines before the closing `}`:
   ```json
   {
     "id": "jpaper4-2025",
     "type": "journal",
     "title": "Frequency-constrained autonomous microgrid planning for mining industry applications",
     "authors": "Hossein Ranjbar, Hirad Assimi, S. Ali Pourmousavi, Wen L Soong",
     "journal": "Applied Energy",
     "volume": "396:126201",
     "year": 2025,
     "month": "Oct.",
     "doi": "https://www.sciencedirect.com/science/article/pii/S2352152X25018171",
     "pdf": "docs/JPaper3-2025.pdf",
     "featured": true,
     "featuredReason": "Novel approach to microgrid frequency control with direct mining industry applications"
   }
   ```

4. Save the file
5. Refresh `publications.html` in your browser
6. Click the "⭐ Featured" tab to see it

---

## ✅ Verification

After making changes:

1. Open `publications.html` in browser
2. Check the "⭐ Featured (X)" tab shows the correct count
3. Click the tab to view your featured papers
4. Verify the "Why Featured" section shows your custom reason (if provided)

---

## 💡 Tips

- **Manually featured papers appear FIRST** (highest priority)
- Award-winning papers are automatically included (if space)
- You can have both `"featured": true` AND `"award": "Best Paper"` on the same paper
- Custom reasons are great for explaining industry impact or practical applications
- Keep featured reasons concise (1-2 sentences, ~100-150 characters)
- Maximum 10 featured papers - choose your most impactful work!

---

## 🔄 To Remove from Featured

Simply remove or change the featured flag:

```json
"featured": false,  // or just delete this line entirely
```

Then save and refresh.
