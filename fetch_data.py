import os
import json
import requests
import datetime
import random

# Configuration
API_KEY = "68e2bfd85d173bb9c601817d969e11e5"
REGISTRY_FILE = "researchers.json"
OUTPUT_FILE = "data.json"

def load_researchers():
    """Loads the researcher registry from JSON file."""
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading {REGISTRY_FILE}: {e}")
            
    # Default fallback list of researchers if registry file does not exist
    return [
        {"author_id": "57209617104", "name": "Somchai Rattanasiri", "department": "Department of Surgery", "status": "Active"},
        {"author_id": "57195977931", "name": "Tinnakorn Harnprasert", "department": "Department of Pediatrics", "status": "Active"},
        {"author_id": "57218392019", "name": "Prasert Srivilas", "department": "Department of Internal Medicine", "status": "Active"},
        {"author_id": "57222419080", "name": "Anan Wongsuwan", "department": "Department of Anesthesiology", "status": "Active"},
        {"author_id": "57205492100", "name": "Siriwan Klinpratoom", "department": "Department of Radiology", "status": "Active"}
    ]

def get_mock_data(researchers):
    """Generates mock publication data using the registered researchers."""
    print("Generating premium mock data using registered researchers database...")
    
    journals = [
        {"title": "Journal of the Medical Association of Thailand", "impact_factor": 0.4},
        {"title": "Southeast Asian Journal of Tropical Medicine and Public Health", "impact_factor": 0.6},
        {"title": "Plos One", "impact_factor": 3.7},
        {"title": "BMC Public Health", "impact_factor": 4.5},
        {"title": "Scientific Reports", "impact_factor": 4.6},
        {"title": "The Lancet", "impact_factor": 202.7},
        {"title": "New England Journal of Medicine", "impact_factor": 176.0},
        {"title": "Asian Pacific Journal of Cancer Prevention", "impact_factor": 1.5}
    ]
    
    research_topics = [
        "Clinical outcomes of laparoscopic surgery in rural Thailand",
        "Prevalence and risk factors of diabetes mellitus in Phitsanulok province",
        "Efficacy of local herbal extracts against drug resistant bacteria",
        "Mental health status and coping mechanisms of medical students under stress",
        "Epidemiological study of dengue hemorrhagic fever patterns in Northern Thailand",
        "Evaluation of telemedicine services in community hospitals during pandemic",
        "Association between PM2.5 exposure and respiratory symptoms in school children",
        "Retrospective study of cardiovascular disease survival rates in tertiary care",
        "Diagnostic accuracy of low-dose computed tomography in detecting lung nodules"
    ]
    
    documents = []
    start_year = 2018
    end_year = 2026
    
    # Generate mock publications specifically mapped to registry list
    for i in range(120):
        year = random.randint(start_year, end_year)
        month = random.randint(1, 12)
        day = random.randint(1, 28)
        cover_date = f"{year}-{month:02d}-{day:02d}"
        
        # Select 1 to 3 authors from registry list
        num_authors = min(random.randint(1, 3), len(researchers))
        doc_researchers = random.sample(researchers, num_authors)
        
        creator = doc_researchers[0]["name"]
        author_names = [r["name"] for r in doc_researchers]
        
        # Admin override department injection logic
        depts = list(set([r["department"] for r in doc_researchers]))
        
        journal = random.choice(journals)
        topic = random.choice(research_topics)
        title = f"{topic}: A {random.choice(['retrospective cohort study', 'cross-sectional analysis', 'systematic review', 'randomized trial'])} of {random.randint(50, 500)} patients"
        
        citations = int(random.lognormvariate(1.8, 1.1))
        if year == 2026:
            citations = random.randint(0, 2)
            
        doi = f"10.1016/j.{journal['title'].lower().replace(' ', '')}.{year}.{random.randint(10000, 99999)}"
        corresponding = random.choice(author_names)
        
        documents.append({
            "title": title,
            "creator": creator,
            "authors": author_names,
            "corresponding_author": corresponding,
            "departments": depts,
            "journal": journal["title"],
            "coverDate": cover_date,
            "year": str(year),
            "citations": citations,
            "doi": doi
        })
        
    return {
        "status": "success",
        "data_source": "mock_data",
        "retrieved_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "affiliation": "Faculty of Medicine, Naresuan University",
        "total_results": len(documents),
        "results": documents
    }

def fetch_scopus_data_for_author(author_id, researcher_name, researcher_dept):
    """Fetches publications for a specific author ID from Scopus."""
    print(f"Fetching publications for researcher: {researcher_name} (ID: {author_id})...")
    url = "https://api.elsevier.com/content/search/scopus"
    headers = {
        "X-ELS-APIKey": API_KEY,
        "Accept": "application/json"
    }
    params = {
        "query": f"AU-ID({author_id})",
        "count": 25,
        "start": 0,
        "field": "dc:title,dc:creator,author,prism:doi,prism:coverDate,prism:publicationName,citedby-count"
    }
    
    author_results = []
    start = 0
    
    try:
        while True:
            params["start"] = start
            response = requests.get(url, headers=headers, params=params, timeout=15)
            if response.status_code != 200:
                print(f"  API Request failed for {researcher_name} at start={start}: {response.status_code}")
                break
                
            data = response.json()
            search_results = data.get("search-results", {})
            entries = search_results.get("entry", [])
            
            if not entries or len(entries) == 0:
                break
                
            for entry in entries:
                title = entry.get("dc:title", "Unknown Title")
                creator = entry.get("dc:creator", "Unknown Author")
                journal = entry.get("prism:publicationName", "Unknown Source")
                cover_date = entry.get("prism:coverDate", "Unknown Date")
                year = cover_date.split("-")[0] if cover_date else "Unknown Year"
                
                try:
                    citations = int(entry.get("citedby-count", 0))
                except ValueError:
                    citations = 0
                    
                doi = entry.get("prism:doi", "")
                
                # Format author list
                author_list = []
                author_names = entry.get("author", [])
                if isinstance(author_names, list):
                    for auth in author_names:
                        auth_name = auth.get("authname", "")
                        if auth_name:
                            author_list.append(auth_name)
                elif isinstance(author_names, dict):
                    auth_name = author_names.get("authname", "")
                    if auth_name:
                        author_list.append(auth_name)
                
                if not author_list:
                    author_list = [creator] if creator else [researcher_name]
                    
                # Clean author names to match registry if applicable
                cleaned_author_list = []
                for name in author_list:
                    matched = False
                    if researcher_name.split()[-1].lower() in name.lower():
                        cleaned_author_list.append(researcher_name)
                        matched = True
                    if not matched:
                        cleaned_author_list.append(name)
                
                author_results.append({
                    "title": title,
                    "creator": researcher_name, # Map directly to register
                    "authors": cleaned_author_list,
                    "corresponding_author": creator if creator else researcher_name,
                    "departments": [researcher_dept], # Admin override injected!
                    "journal": journal,
                    "coverDate": cover_date,
                    "year": year,
                    "citations": citations,
                    "doi": doi
                })
                
            total_results = int(search_results.get("opensearch:totalResults", 0))
            current_start = int(search_results.get("opensearch:startIndex", 0))
            items_per_page = int(search_results.get("opensearch:itemsPerPage", 0))
            
            print(f"  {researcher_name}: Fetched {len(author_results)} of {total_results} publications...")
            
            if current_start + items_per_page >= total_results or len(author_results) >= total_results:
                break
                
            start = current_start + items_per_page
            
        return author_results
    except Exception as e:
        print(f"  Error fetching data for author {author_id}: {e}")
        return []

def main():
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_FILE)) or '.', exist_ok=True)
    
    # 1. Load registry list
    researchers = load_researchers()
    print(f"Loaded {len(researchers)} researchers from registry.")
    
    all_results = []
    scopus_success = True
    
    # 2. Loop and fetch publications for each researcher
    for res in researchers:
        res_pubs = fetch_scopus_data_for_author(res["author_id"], res["name"], res["department"])
        if len(res_pubs) > 0:
            all_results.extend(res_pubs)
        else:
            # If any individual API call fails and we get zero results for an active author,
            # it might be due to credentials or IP restrictions.
            # We flag this to decide whether to fall back to mock data
            if res == researchers[0]:
                scopus_success = False
                
    # 3. Deduplicate publications (using DOI or Title if DOI is empty)
    unique_docs = {}
    for doc in all_results:
        key = doc["doi"] if doc["doi"] else doc["title"].lower().strip()
        if key not in unique_docs:
            unique_docs[key] = doc
        else:
            # Merge departments lists if the same paper was fetched via multiple authors
            existing = unique_docs[key]
            merged_depts = list(set(existing["departments"] + doc["departments"]))
            existing["departments"] = merged_depts
            # Keep highest citations count if they differ
            existing["citations"] = max(existing["citations"], doc["citations"])
            
    final_results = list(unique_docs.values())
    
    # 4. Save results or fallback to mock data
    if len(final_results) > 0 and scopus_success:
        data = {
            "status": "success",
            "data_source": "scopus_api",
            "retrieved_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "affiliation": "Faculty of Medicine, Naresuan University",
            "total_results": len(final_results),
            "results": final_results
        }
    else:
        # Fallback to Sandbox mock data mapped to registry
        data = get_mock_data(researchers)
        
    # Include list of registered researchers in dataset
    data["researchers"] = researchers
        
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved database containing {len(data['results'])} publications to {OUTPUT_FILE}!")

if __name__ == "__main__":
    main()
