// Adapted from @preview/basic-resume:0.2.9 (Unlicense)
// https://github.com/stuxf/basic-typst-resume-template

#let resume-font = ("Libertinus Serif", "Liberation Serif", "New Computer Modern")
#let resume-accent = state("resume-accent", rgb("#000080"))

#let resume(
    author: "",
    author-position: left,
    personal-info-position: left,
    pronouns: "",
    location: "",
    email: "",
    github: "",
    linkedin: "",
    phone: "",
    personal-site: "",
    accent-color: "#000080",
    font: resume-font,
    paper: "a4",
    author-font-size: 17pt,
    font-size: 9.5pt,
    lang: "en",
    body,
) = {
    set document(author: author, title: author)
    resume-accent.update(rgb(accent-color))

    set text(
        font: font,
        size: font-size,
        lang: lang,
        ligatures: false,
        weight: "regular",
    )

    set page(
        margin: (x: 0.5in, y: 0.32in),
        paper: paper,
    )

    set par(
        justify: false,
        leading: 0.38em,
        spacing: 0.6em,
    )

    set list(
        indent: 0.1in,
        body-indent: 0.4em,
        spacing: 0.55em,
        tight: true,
        marker: box(
            width: 0.4em,
            height: 0.4em,
            baseline: -0.05em,
            align(center + horizon, circle(radius: 1.05pt, fill: black)),
        ),
    )

    show link: set text(fill: rgb(accent-color))
    show link: underline.with(offset: 1.5pt, stroke: 0.6pt)

    show heading.where(level: 2): it => {
        block(above: 5pt, below: 4pt, width: 100%)[
            #stack(
                spacing: 2pt,
                text(
                    fill: rgb(accent-color),
                    weight: "bold",
                    size: 10pt,
                    tracking: 0.12em,
                    upper(it.body),
                ),
                line(length: 100%, stroke: 0.75pt + rgb(accent-color).lighten(55%)),
            )
        ]
    }

    let contact-item(value, link-type: "") = {
        if value != "" {
            if link-type != "" {
                link(link-type + value)[#value]
            } else {
                value
            }
        }
    }

    let contact-row(items) = {
        let parts = items.filter(x => x != none)
        if parts.len() == 0 {
            none
        } else {
            parts.join([#h(0.4em)·#h(0.4em)])
        }
    }

    let primary-contact = contact-row((
        contact-item(location),
        contact-item(phone),
        contact-item(email, link-type: "mailto:"),
    ))

    let secondary-contact = contact-row((
        contact-item(personal-site, link-type: "https://"),
        contact-item(github, link-type: "https://"),
        contact-item(linkedin, link-type: "https://"),
        contact-item(pronouns),
    ))

    block(below: 8pt, width: 100%)[
        #align(center)[
            #text(
                fill: rgb(accent-color),
                weight: 700,
                size: author-font-size + 3pt,
                tracking: 0.06em,
            )[#author]
            #v(5pt, weak: true)
            #{
                show link: it => {
                    set text(fill: rgb(accent-color))
                    underline(offset: 1.2pt, stroke: 0.45pt + rgb(accent-color).lighten(25%), it.body)
                }
                set text(size: 8.5pt)
                set par(leading: 0.55em, spacing: 0.4em)
                stack(
                    spacing: 0.4em,
                    ..(primary-contact, secondary-contact).filter(x => x != none),
                )
            }
        ]
    ]

    body
}

#let generic-two-by-two(
    top-left: "",
    top-right: "",
    bottom-left: "",
    bottom-right: "",
) = {
    grid(
        columns: (1fr, auto),
        align: (start, end),
        row-gutter: 5pt,
        top-left,
        top-right,
        bottom-left,
        bottom-right,
    )
}

#let generic-one-by-two(
    left: "",
    right: "",
) = {
    grid(
        columns: (1fr, auto),
        align: (start, end),
        left,
        right,
    )
}

#let dates-helper(
    start-date: "",
    end-date: "",
) = {
    start-date + " " + $dash.em$ + " " + end-date
}

#let edu(
    institution: "",
    dates: "",
    degree: "",
    gpa: "",
    location: "",
    consistent: false,
) = {
    if consistent {
        generic-two-by-two(
            top-left: strong(institution),
            top-right: dates,
            bottom-left: emph(degree),
            bottom-right: emph(location),
        )
    } else {
        generic-two-by-two(
            top-left: strong(institution),
            top-right: location,
            bottom-left: emph(degree),
            bottom-right: emph(dates),
        )
    }
}

#let work(
    title: "",
    dates: "",
    company: "",
    location: "",
) = {
    generic-two-by-two(
        top-left: strong(title),
        top-right: dates,
        bottom-left: company,
        bottom-right: emph(location),
    )
}

#let company-header(name, url: "") = {
    context {
        let accent = resume-accent.get()
        block(breakable: false, above: 3pt, below: 0pt)[
            #set text(size: 10.5pt, weight: "bold", fill: accent)
            #if url != "" {
                show link: it => it.body
                link(url)[#name]
            } else {
                name
            }
        ]
        v(-2pt)
    }
}

#let role(
    title: "",
    location: "",
    employment: "",
    dates: "",
) = {
    block(below: 4pt)[
        #generic-two-by-two(
            top-left: strong(title),
            top-right: location,
            bottom-left: if employment != "" { emph(employment) } else { [] },
            bottom-right: emph(dates),
        )
    ]
}

#let role-entry(
    title: "",
    location: "",
    employment: "",
    dates: "",
    body,
) = {
    block(above: 5pt, below: 0pt, breakable: false)[
        #grid(
            columns: (0.14in, 1fr),
            column-gutter: 0.3em,
            align: (top + left, top + left),
            box(
                width: 0.45em,
                height: 0.8em,
                align(center + horizon, circle(radius: 1.4pt, fill: black)),
            ),
            [
                #generic-two-by-two(
                    top-left: strong(title),
                    top-right: location,
                    bottom-left: if employment != "" { emph(employment) } else { [] },
                    bottom-right: emph(dates),
                )
                #v(2pt)
                #set list(
                    marker: box(
                        width: 0.45em,
                        height: 0.45em,
                        baseline: -0.05em,
                        align(center + horizon, circle(radius: 1.35pt, stroke: 0.8pt + black)),
                    ),
                    indent: 0pt,
                    body-indent: 0.4em,
                    spacing: 0.55em,
                    tight: true,
                )
                #set par(leading: 0.38em, spacing: 0.55em)
                #body
            ],
        )
    ]
}

#let project(
    role: "",
    name: "",
    url: "",
    dates: "",
) = {
    block(above: 3pt, below: 4pt)[
        #generic-one-by-two(
            left: {
                if role == "" {
                    [*#name* #if url != "" [ (#link("https://" + url)[#url])]]
                } else {
                    [*#role*, #name #if url != "" [ (#link("https://" + url)[#url])]]
                }
            },
            right: dates,
        )
    ]
}

#let certificates(
    name: "",
    issuer: "",
    url: "",
    date: "",
) = {
    [
        *#name*, #issuer
        #if url != "" {
            [ (#link("https://" + url)[#url])]
        }
        #h(1fr) #date
    ]
}

#let extracurriculars(
    activity: "",
    dates: "",
) = {
    generic-one-by-two(
        left: strong(activity),
        right: dates,
    )
}
